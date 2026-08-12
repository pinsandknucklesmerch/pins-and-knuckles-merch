#!/usr/bin/env bash
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
project_dir=$(CDPATH= cd -- "$script_dir/.." && pwd)
. "$script_dir/lib/load-restore-database-url.sh"
load_restore_database_url "$project_dir"
. "$script_dir/lib/load-restore-admin-database-url.sh"
load_restore_admin_database_url "$project_dir"
# Load DIRECT_DATABASE_URL only for the equality guard; it is never used as the
# restore target and RESTORE_DATABASE_URL remains the only database argument.
. "$script_dir/lib/load-direct-database-url.sh"
load_direct_database_url "$project_dir"

usage() {
  echo "Usage: npm run db:restore -- backups/database/<file>.dump" >&2
}

if [ "$#" -ne 1 ]; then
  echo "Error: a single dump file path is required." >&2
  usage
  exit 2
fi

backup_path=$1
if [ ! -f "$backup_path" ]; then
  echo "Error: backup file does not exist or is not a regular file: $backup_path" >&2
  exit 2
fi

if ! command -v pg_restore >/dev/null 2>&1; then
  echo "Error: pg_restore is required but was not found. Install the PostgreSQL client tools and try again." >&2
  exit 3
fi

if ! pg_restore --list "$backup_path" >/dev/null 2>&1; then
  echo "Error: backup file is invalid or unreadable by pg_restore." >&2
  exit 4
fi

if [ -z "${RESTORE_DATABASE_URL:-}" ]; then
  echo "Error: RESTORE_DATABASE_URL is missing (set it in .env.local or the environment)." >&2
  exit 5
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 is required to validate the PostgreSQL URI." >&2
  exit 3
fi

target_info=$(python3 - "$RESTORE_DATABASE_URL" <<'PY'
import sys
from urllib.parse import urlsplit

uri = sys.argv[1]
try:
    parsed = urlsplit(uri)
    if parsed.scheme not in ("postgres", "postgresql"):
        raise ValueError("scheme must be postgres or postgresql")
    if not parsed.hostname:
        raise ValueError("hostname is missing")
    port = parsed.port or 5432
    if not 1 <= port <= 65535:
        raise ValueError("port is out of range")
    database = parsed.path[1:] if parsed.path.startswith("/") else parsed.path
    if not database:
        raise ValueError("database name is missing")
except (ValueError, UnicodeError) as exc:
    print(f"{exc}", file=sys.stderr)
    raise SystemExit(1)

print(parsed.hostname.lower())
print(database)
print(port)
PY
) || {
  echo "Error: RESTORE_DATABASE_URL is malformed (expected a PostgreSQL URI with a hostname and database name)." >&2
  exit 6
}

target_hostname=$(printf '%s\n' "$target_info" | sed -n '1p')
target_database=$(printf '%s\n' "$target_info" | sed -n '2p')
target_port=$(printf '%s\n' "$target_info" | sed -n '3p')

if [ "${DIRECT_DATABASE_URL:-}" != "" ] && [ "$RESTORE_DATABASE_URL" = "$DIRECT_DATABASE_URL" ]; then
  echo "Error: RESTORE_DATABASE_URL matches DIRECT_DATABASE_URL; refusing to target the live database." >&2
  exit 7
fi

case "$target_hostname" in
  supabase.co|*.supabase.co|*.pooler.supabase.com)
    echo "Error: RESTORE_DATABASE_URL appears to target a Supabase production endpoint; refusing to restore." >&2
    exit 7
    ;;
esac

if [ -n "${RESTORE_ADMIN_DATABASE_URL:-}" ]; then
  admin_info=$(python3 - "$RESTORE_ADMIN_DATABASE_URL" <<'PY'
import sys
from urllib.parse import urlsplit

uri = sys.argv[1]
try:
    parsed = urlsplit(uri)
    if parsed.scheme not in ("postgres", "postgresql"):
        raise ValueError("scheme must be postgres or postgresql")
    if not parsed.hostname:
        raise ValueError("hostname is missing")
    port = parsed.port or 5432
    if not 1 <= port <= 65535:
        raise ValueError("port is out of range")
    database = parsed.path[1:] if parsed.path.startswith("/") else parsed.path
    if not database:
        raise ValueError("database name is missing")
except (ValueError, UnicodeError) as exc:
    print(f"{exc}", file=sys.stderr)
    raise SystemExit(1)

print(parsed.hostname.lower())
print(database)
print(port)
PY
  ) || {
    echo "Error: RESTORE_ADMIN_DATABASE_URL is malformed; expected a PostgreSQL URI with a hostname and database name." >&2
    exit 6
  }

  admin_hostname=$(printf '%s\n' "$admin_info" | sed -n '1p')
  admin_database=$(printf '%s\n' "$admin_info" | sed -n '2p')
  admin_port=$(printf '%s\n' "$admin_info" | sed -n '3p')

  if [ "${DIRECT_DATABASE_URL:-}" != "" ] && [ "$RESTORE_ADMIN_DATABASE_URL" = "$DIRECT_DATABASE_URL" ]; then
    echo "Error: RESTORE_ADMIN_DATABASE_URL matches DIRECT_DATABASE_URL; refusing to use it." >&2
    exit 7
  fi

  case "$admin_hostname" in
    supabase.co|*.supabase.co|*.pooler.supabase.com)
      echo "Error: RESTORE_ADMIN_DATABASE_URL appears to target a Supabase production endpoint; refusing to use it." >&2
      exit 7
      ;;
  esac

  if [ "$admin_hostname" != "$target_hostname" ] || [ "$admin_database" != "$target_database" ] || [ "$admin_port" != "$target_port" ]; then
    echo "Error: RESTORE_ADMIN_DATABASE_URL must point to the same local database as RESTORE_DATABASE_URL." >&2
    exit 7
  fi
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "Error: psql is required for the auth ownership diagnostic and cleanup but was not found." >&2
  exit 3
fi

diagnostic_sql="select pg_get_userbyid(c.relowner), current_user, case when r.rolsuper or current_user = pg_get_userbyid(c.relowner) or pg_has_role(current_user, pg_get_userbyid(c.relowner), 'member') then 'yes' else 'no' end from pg_class c join pg_namespace n on n.oid = c.relnamespace join pg_roles r on r.rolname = current_user where n.nspname = 'auth' and c.relname = 'users';"
diagnostic_error_file=${TMPDIR:-/tmp}/pins-hub-restore-diagnostic.$$
if ! restore_diagnostic=$(psql --no-psqlrc --no-password --set=ON_ERROR_STOP=1 --tuples-only --no-align --field-separator='|' --dbname="$RESTORE_DATABASE_URL" --command="$diagnostic_sql" 2>"$diagnostic_error_file"); then
  rm -f "$diagnostic_error_file"
  echo "Error: could not inspect auth.users ownership using RESTORE_DATABASE_URL; no credentials or URI were printed." >&2
  exit 9
fi
rm -f "$diagnostic_error_file"

auth_owner=$(printf '%s\n' "$restore_diagnostic" | sed -n 's/^\([^|]*\)|.*$/\1/p' | sed -n '1p' | sed 's/[[:space:]]//g')
restore_role=$(printf '%s\n' "$restore_diagnostic" | sed -n 's/^[^|]*|\([^|]*\)|.*$/\1/p' | sed 's/[[:space:]]//g')
restore_can_owner=$(printf '%s\n' "$restore_diagnostic" | sed -n 's/^[^|]*|[^|]*|\([^|]*\).*$/\1/p' | sed 's/[[:space:]]//g')

auth_database_url="$RESTORE_DATABASE_URL"
auth_role="$restore_role"
auth_can_owner="$restore_can_owner"
if [ "$restore_can_owner" != "yes" ]; then
  if [ -z "${RESTORE_ADMIN_DATABASE_URL:-}" ]; then
    echo "Diagnostic: auth.users owner role: $auth_owner" >&2
    echo "Diagnostic: restore connection role: $restore_role" >&2
    echo "Diagnostic: owner-level auth operation available: no" >&2
    echo "Error: RESTORE_ADMIN_DATABASE_URL is required for local auth.users cleanup." >&2
    exit 7
  fi

  if ! admin_diagnostic=$(psql --no-psqlrc --no-password --set=ON_ERROR_STOP=1 --tuples-only --no-align --field-separator='|' --dbname="$RESTORE_ADMIN_DATABASE_URL" --command="$diagnostic_sql" 2>"$diagnostic_error_file"); then
    rm -f "$diagnostic_error_file"
    echo "Error: could not inspect auth.users ownership using RESTORE_ADMIN_DATABASE_URL; no credentials or URI were printed." >&2
    exit 9
  fi
  rm -f "$diagnostic_error_file"

  admin_role=$(printf '%s\n' "$admin_diagnostic" | sed -n 's/^[^|]*|\([^|]*\)|.*$/\1/p' | sed 's/[[:space:]]//g')
  admin_can_owner=$(printf '%s\n' "$admin_diagnostic" | sed -n 's/^[^|]*|[^|]*|\([^|]*\).*$/\1/p' | sed 's/[[:space:]]//g')
  if [ "$admin_can_owner" != "yes" ]; then
    echo "Diagnostic: auth.users owner role: $auth_owner" >&2
    echo "Diagnostic: restore connection role: $restore_role" >&2
    echo "Diagnostic: owner-level auth operation available: no" >&2
    echo "Diagnostic: privileged connection role: $admin_role" >&2
    echo "Error: RESTORE_ADMIN_DATABASE_URL cannot perform the required auth.users owner operation." >&2
    exit 7
  fi
  auth_database_url="$RESTORE_ADMIN_DATABASE_URL"
  auth_role="$admin_role"
  auth_can_owner="$admin_can_owner"
fi

backup_filename=$(basename -- "$backup_path")
echo "About to restore:"
echo "  Backup: $backup_filename"
echo "  Target hostname: $target_hostname"
echo "  Target database: $target_database"
echo "  Restore mode: public schema + required auth.users data"
echo "  Public schema reset: yes (objects only; schema/grants preserved)"
echo "  Auth reset: local auth.users and dependent rows only"
echo "  --clean enabled: no"
echo "  Public TOC filtering: DEFAULT ACL and public schema ACL excluded"
echo "  Auth users owner role: $auth_owner"
echo "  Restore connection role: $restore_role"
if [ "$restore_can_owner" = "yes" ]; then
  echo "  Owner-level auth operation available: yes (restore connection)"
else
  echo "  Owner-level auth operation available: yes (privileged local connection)"
fi
echo
echo "public.profiles IDs reference auth.users IDs, so production auth.users data is loaded before public constraints."
echo "Only auth.users data is restored; sessions, refresh tokens, MFA, OAuth state, and other transient auth data are excluded."
echo "The local auth schema/functions/extensions and all other managed schemas remain intact."
echo "The local auth user trigger is disabled during user loading and recreated after the public restore."
echo "Existing non-extension objects in public will be removed after confirmation."
echo
printf 'Type RESTORE to continue: '
if [ ! -t 0 ] || [ ! -t 1 ]; then
  echo >&2
  echo "Error: interactive confirmation is required; restore aborted." >&2
  exit 8
fi
IFS= read -r confirmation < /dev/tty || confirmation=''
if [ "$confirmation" != "RESTORE" ]; then
  echo "Restore aborted." >&2
  exit 8
fi

error_file=${TMPDIR:-/tmp}/pins-hub-restore-error.$$
public_toc_file=$(mktemp "${TMPDIR:-/tmp}/pins-hub-public-toc.XXXXXX")
cleanup() {
  # Do not leave local auth user triggers disabled if a later phase fails.
  psql --no-psqlrc --no-password --dbname="$auth_database_url" \
    --command='ALTER TABLE auth.users ENABLE TRIGGER USER;' \
    >/dev/null 2>/dev/null || true
  rm -f "$error_file"
  rm -f "$public_toc_file"
}
trap cleanup EXIT HUP INT TERM

if ! pg_restore --list "$backup_path" | awk '
  /^;/ { print; next }
  / public([ .])/ {
    if ($0 ~ /DEFAULT ACL/ || $0 ~ /SCHEMA - public/ || $0 ~ /ACL - SCHEMA public/) next
    kept = kept + 1
    print
  }
  END { if (kept == 0) exit 1 }
' >"$public_toc_file"; then
  echo "Error: could not build the filtered public restore TOC; restore aborted before database changes." >&2
  exit 10
fi

reset_public_sql=$(cat <<'SQL'
DO $$
DECLARE
  object_record record;
BEGIN
  -- Remove public functions first so table drops cannot leave duplicates behind.
  -- Extension members are deliberately excluded; managed schemas are never queried.
  FOR object_record IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS arguments
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_depend d
        WHERE d.classid = 'pg_proc'::regclass
          AND d.objid = p.oid
          AND d.deptype = 'e'
      )
  LOOP
    EXECUTE format(
      'DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
      'public', object_record.proname, object_record.arguments
    );
  END LOOP;

  -- Drop only non-extension relations in public. CASCADE removes their policies,
  -- triggers, indexes, constraints, and owned sequences in dependency order.
  FOR object_record IN
    SELECT c.relkind, c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p', 'f', 'v', 'm', 'S')
      AND NOT EXISTS (
        SELECT 1
        FROM pg_depend d
        WHERE d.classid = 'pg_class'::regclass
          AND d.objid = c.oid
          AND d.deptype = 'e'
      )
  LOOP
    IF object_record.relkind = 'S' THEN
      EXECUTE format('DROP SEQUENCE IF EXISTS %I.%I CASCADE', 'public', object_record.relname);
    ELSIF object_record.relkind = 'v' THEN
      EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', 'public', object_record.relname);
    ELSIF object_record.relkind = 'm' THEN
      EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS %I.%I CASCADE', 'public', object_record.relname);
    ELSE
      EXECUTE format('DROP TABLE IF EXISTS %I.%I CASCADE', 'public', object_record.relname);
    END IF;
  END LOOP;
END
$$;
SQL
)

if ! psql \
  --no-psqlrc \
  --no-password \
  --set=ON_ERROR_STOP=1 \
  --dbname="$RESTORE_DATABASE_URL" \
  --command="$reset_public_sql" \
  2>"$error_file" >/dev/null; then
  if grep -Eqi 'password authentication failed|authentication failed|could not translate host name|name or service not known|temporary failure in name resolution|connection refused|could not connect to server|timeout expired|timed out|no route to host|ssl|tls|certificate' "$error_file"; then
    echo "Error: connection failure while connecting to the restore target; public schema was not restored." >&2
    exit 9
  fi
  echo "Error: public-schema reset failed; public schema was not restored." >&2
  sed -n '1,8p' "$error_file" >&2
  exit 10
fi

auth_prepare_sql=$(cat <<'SQL'
BEGIN;
-- The public reset may remove the application profile trigger by dependency.
-- Disable any remaining user triggers so auth.users loading cannot create or
-- update public.profiles as a side effect.
ALTER TABLE auth.users DISABLE TRIGGER USER;

-- On the disposable target, deleting users removes local identities, sessions,
-- refresh-token rows, MFA rows, and other user-dependent rows through the
-- existing auth foreign keys. Auth schema objects and auth.instances remain.
DELETE FROM auth.users;
COMMIT;
SQL
)

if ! psql \
  --no-psqlrc \
  --no-password \
  --set=ON_ERROR_STOP=1 \
  --dbname="$auth_database_url" \
  --command="$auth_prepare_sql" \
  2>"$error_file" >/dev/null; then
  if grep -Eqi 'password authentication failed|authentication failed|could not translate host name|name or service not known|temporary failure in name resolution|connection refused|could not connect to server|timeout expired|timed out|no route to host|ssl|tls|certificate' "$error_file"; then
    echo "Error: connection failure while preparing local auth users; public schema was restored but auth data was not." >&2
    exit 9
  fi
  echo "Error: local auth user cleanup failed; no auth data was restored." >&2
  sed -n '1,8p' "$error_file" >&2
  exit 10
fi

if ! pg_restore \
  --exit-on-error \
  --data-only \
  --no-owner \
  --schema=auth \
  --table=users \
  --dbname="$RESTORE_DATABASE_URL" \
  "$backup_path" \
  2>"$error_file"; then
  if grep -Eqi 'password authentication failed|authentication failed|could not translate host name|name or service not known|temporary failure in name resolution|connection refused|could not connect to server|timeout expired|timed out|no route to host|ssl|tls|certificate' "$error_file"; then
    echo "Error: connection failure while restoring auth.users data; public schema was reset but not restored." >&2
    exit 9
  fi
  echo "Error: auth.users data restore failed; details are redacted because PostgreSQL errors may contain user emails or other auth data." >&2
  exit 10
fi

if pg_restore \
  --exit-on-error \
  --no-owner \
  --use-list="$public_toc_file" \
  --dbname="$RESTORE_DATABASE_URL" \
  "$backup_path" \
  2>"$error_file"; then
  auth_finalize_sql=$(cat <<'SQL'
BEGIN;
ALTER TABLE auth.users ENABLE TRIGGER USER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
COMMIT;
SQL
  )

  if ! psql \
    --no-psqlrc \
    --no-password \
    --set=ON_ERROR_STOP=1 \
    --dbname="$auth_database_url" \
    --command="$auth_finalize_sql" \
    2>"$error_file" >/dev/null; then
    echo "Error: public restore completed but the local auth user trigger could not be restored; first error follows:" >&2
    sed -n '1,8p' "$error_file" >&2
    exit 10
  fi

  echo "Restore completed successfully (public schema plus required auth.users data)."
  exit 0
fi

if grep -Eqi 'password authentication failed|authentication failed|could not translate host name|name or service not known|temporary failure in name resolution|connection refused|could not connect to server|timeout expired|timed out|no route to host|ssl|tls|certificate' "$error_file"; then
  echo "Error: connection failure while connecting to the restore target; no credentials or full URI were printed." >&2
  exit 9
fi

echo "Error: restore failed while applying the public schema; first error follows (credentials and full URI are omitted):" >&2
sed -n '1,8p' "$error_file" >&2
exit 10
