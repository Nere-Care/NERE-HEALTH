import os
import sys
from pathlib import Path
from sqlalchemy import inspect

ROOT = Path(__file__).resolve().parents[1]
os.chdir(str(ROOT))
sys.path.insert(0, str(ROOT))

from backend.config import settings
from backend.db import engine

print('CWD', os.getcwd())
print('DATABASE_URL', settings.DATABASE_URL)
print('ENGINE URL', engine.url)
print('DB file exists', Path('backend/test.db').exists())
try:
    with engine.connect() as conn:
        inspector = inspect(conn)
        print('connected, tables:', inspector.get_table_names())
except Exception as e:
    print('connection error', repr(e))
