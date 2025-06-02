#!/usr/bin/env bash

set -ex


until psql "${POSTGRES_DSN}" -c '\q' 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

while true; do
  TABLES_EXISTS=$(psql "$POSTGRES_DSN" -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'border_info');")
  if [ "$TABLES_EXISTS" = "t" ]; then
    break
  fi
  echo "Waiting for the border_info table to be created..."
  sleep 2
done

CATALOG_EXISTS=$(psql "$POSTGRES_DSN" -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'ai' AND table_name = 'semantic_catalog');")
if [ "$CATALOG_EXISTS" = "f" ]; then
  export TARGET_DB="${POSTGRES_DSN}"
  uv run pgai semantic-catalog create
  uv run pgai semantic-catalog import -f /app/db/descriptions.yml
  echo $?
fi

uv run quart --app main run --host=0.0.0.0 --port=8080
