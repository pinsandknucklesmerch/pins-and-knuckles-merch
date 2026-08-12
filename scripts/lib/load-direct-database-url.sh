# Shared, non-evaluating loader for the local direct PostgreSQL connection URI.
# The value is assigned literally; this file never prints or sources .env.local.

load_direct_database_url() {
  local project_dir="${1:?project directory is required}"
  local env_file="$project_dir/.env.local"
  local value

  [ -n "${DIRECT_DATABASE_URL:-}" ] && return 0
  [ -f "$env_file" ] || return 0

  value=$(sed -n -E 's/^[[:space:]]*(export[[:space:]]+)?DIRECT_DATABASE_URL[[:space:]]*=[[:space:]]*//p' "$env_file" | tail -n 1)
  # A CR at the end of a CRLF dotenv line is not part of the URI.
  value=${value%$'\r'}

  case "$value" in
    \"*\") value=${value#\"}; value=${value%\"} ;;
    \'*\') value=${value#\'}; value=${value%\'} ;;
  esac

  if [ -n "$value" ]; then
    export DIRECT_DATABASE_URL="$value"
  fi
}
