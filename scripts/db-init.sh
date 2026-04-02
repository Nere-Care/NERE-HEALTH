#!/bin/sh
set -e

DB_HOST=db
DB_USER=${POSTGRES_USER:-nere_user}
DB_PASS=${POSTGRES_PASSWORD:-nere_pass}
DB_NAME=${POSTGRES_DB:-nere_db}
SQL_FILE=/scripts/nere_schema.sql

export PGPASSWORD="$DB_PASS"
echo "Waiting for Postgres at $DB_HOST..."
until pg_isready -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
  echo "Postgres not ready yet..."
  sleep 1
done

echo "Postgres is ready. Checking existing tables..."
TABLE_COUNT=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "select count(*) from information_schema.tables where table_schema='public';")
TABLE_COUNT=$(echo "$TABLE_COUNT" | tr -d '[:space:]')

echo "public table count=$TABLE_COUNT"
if [ "$TABLE_COUNT" = "0" ] || [ -z "$TABLE_COUNT" ]; then
  echo "No tables found. Loading schema from $SQL_FILE"
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE"
else
  echo "Schema already present, skipping initial schema load."
fi
