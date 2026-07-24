#!/bin/sh
# Fix permissions on the uploads volume (runs as root before dropping to app user)
chown -R app:app /app/uploads 2>/dev/null || true
exec gosu app "$@"
