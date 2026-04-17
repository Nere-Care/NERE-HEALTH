import time
import sys

import psycopg2
from psycopg2 import OperationalError

from config import settings


def wait_for_db(timeout: int = 60, interval: int = 2) -> None:
    elapsed = 0
    while elapsed < timeout:
        try:
            conn = psycopg2.connect(settings.DATABASE_URL_RAW, connect_timeout=5)
            conn.close()
            print('Database ready.')
            return
        except OperationalError as exc:
            print(f'Waiting for database ({elapsed}s)... {exc}')
            time.sleep(interval)
            elapsed += interval
    print('Database connection timeout reached.')
    sys.exit(1)


if __name__ == '__main__':
    wait_for_db()
