#!/bin/sh
set -e

python -m backend.wait_for_db
alembic upgrade head
exec gunicorn backend.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --workers 2
