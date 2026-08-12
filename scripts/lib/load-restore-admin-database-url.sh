load_restore_admin_database_url() {
  local project_dir="${1:?project directory is required}"
  local env_file="$project_dir/.env.local"
  local value

  [ -n "${RESTORE_ADMIN_DATABASE_URL:-}" ] && return 0
  [ -f "$env_file" ] || return 0

  value=$(sed -n -E 's/^[[:space:]]*(export[[:space:]]+)?RESTORE_ADMIN_DATABASE_URL[[:space:]]*=[[:space:]]*//p' "$env_file" | tail -n 1)
  value=${value%$'\r'}

  case "$value" in
    \"*\") value=${value#\"}; value=${value%\"} ;;
    \'*\') value=${value#\'}; value=${value%\'} ;;
  esac

  if [ -n "$value" ]; then
    export RESTORE_ADMIN_DATABASE_URL="$value"
  fi
}
