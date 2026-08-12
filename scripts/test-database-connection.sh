#!/usr/bin/env bash

# Redacted local connectivity diagnostic. This never prints the URI or runs a
# write query; the connection test is SELECT 1 only.
set -u

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
project_dir=$(CDPATH= cd -- "$script_dir/.." && pwd)
. "$script_dir/lib/load-direct-database-url.sh"
load_direct_database_url "$project_dir"

if [ -z "${DIRECT_DATABASE_URL:-}" ]; then
  echo "Error: DIRECT_DATABASE_URL is missing (set it in .env.local or the environment)." >&2
  exit 2
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 is required to validate the PostgreSQL URI." >&2
  exit 3
fi

# Parse and validate without including any credential fields in output.
if ! python3 - "$DIRECT_DATABASE_URL" <<'PY'
import sys
from urllib.parse import urlsplit

uri = sys.argv[1]
try:
    parsed = urlsplit(uri)
    if parsed.scheme not in ("postgres", "postgresql"):
        raise ValueError("scheme must be postgres or postgresql")
    if not parsed.hostname:
        raise ValueError("hostname is missing")
    port = parsed.port
    if port is None:
        port = 5432
    if not (1 <= port <= 65535):
        raise ValueError("port is out of range")
    database = parsed.path[1:] if parsed.path.startswith("/") else parsed.path
    if not database:
        raise ValueError("database name is missing")
except (ValueError, UnicodeError) as exc:
    print(f"Error: malformed PostgreSQL URI ({exc}).", file=sys.stderr)
    raise SystemExit(1)

print(f"Protocol: {parsed.scheme}")
print(f"Hostname: {parsed.hostname}")
print(f"Port: {port}")
print(f"Database: {database}")
print(f"Username: {'present (redacted)' if parsed.username else 'missing'}")
print(f"Password: {'present (redacted)' if parsed.password else 'missing'}")

host = parsed.hostname.lower()
if not host.endswith(".pooler.supabase.com"):
    print("Warning: hostname is not a Supabase pooler hostname.")
if port != 5432:
    print("Warning: Session Pooler connections are expected to use port 5432.")
if not parsed.username or not parsed.username.startswith("postgres."):
    print("Warning: Session Pooler usernames are expected to use postgres.<project-ref>.")
if database != "postgres":
    print("Warning: the Supabase database name is normally postgres.")
PY
then
  exit 2
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "Error: psql is required for the connectivity test but was not found." >&2
  exit 3
fi

error_file="${TMPDIR:-/tmp}/pins-hub-psql-error.$$"
trap 'rm -f "$error_file"' EXIT HUP INT TERM

if psql --no-psqlrc --no-password --dbname="$DIRECT_DATABASE_URL" --set=ON_ERROR_STOP=1 --command='SELECT 1;' 2>"$error_file" >/dev/null; then
  echo "Connection: successful (SELECT 1 completed)."
  exit 0
fi

if grep -Eqi 'password authentication failed|authentication failed' "$error_file"; then
  echo "Connection: password authentication failed. Verify the Supabase password, pooler username, and percent-encoding." >&2
elif grep -Eqi 'could not translate host name|name or service not known|temporary failure in name resolution' "$error_file"; then
  echo "Connection: DNS/hostname resolution failed. Verify the Session Pooler hostname." >&2
elif grep -Eqi 'connection refused|could not connect to server|timeout expired|timed out|no route to host' "$error_file"; then
  echo "Connection: network failure or unreachable PostgreSQL endpoint." >&2
elif grep -Eqi 'ssl|tls|certificate' "$error_file"; then
  echo "Connection: SSL/TLS negotiation failed. Verify the URI sslmode and local CA/TLS settings." >&2
else
  echo "Connection: failed for an unclassified PostgreSQL error (details intentionally redacted)." >&2
fi
exit 4
