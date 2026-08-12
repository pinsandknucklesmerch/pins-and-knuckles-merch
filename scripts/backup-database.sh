#!/usr/bin/env bash

# Creates a local, read-only PostgreSQL backup. No restore or migration actions
# are performed by this script.
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
project_dir=$(CDPATH= cd -- "$script_dir/.." && pwd)
. "$script_dir/lib/load-direct-database-url.sh"
load_direct_database_url "$project_dir"

if [ -z "${DIRECT_DATABASE_URL:-}" ]; then
  echo "Error: DIRECT_DATABASE_URL is required. Set it in your environment or .env.local." >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "Error: pg_dump is required but was not found. Install the PostgreSQL client tools and try again." >&2
  exit 1
fi

backup_dir="$project_dir/backups/database"
timestamp=$(date '+%Y-%m-%d_%H-%M-%S')
backup_path="$backup_dir/pins-hub-$timestamp.dump"
temporary_path="$backup_path.partial.$$"

mkdir -p "$backup_dir"

cleanup() {
  rm -f "$temporary_path"
}
trap cleanup EXIT HUP INT TERM

if ! pg_dump --format=custom --file="$temporary_path" "$DIRECT_DATABASE_URL"; then
  echo "Error: database backup failed." >&2
  exit 1
fi

mv "$temporary_path" "$backup_path"
trap - EXIT HUP INT TERM

file_size=$(du -h "$backup_path" | awk '{print $1}')
echo "Backup created: $backup_path"
echo "File size: $file_size"
