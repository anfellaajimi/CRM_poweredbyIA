import getpass
import os
import sys

import psycopg2
from dotenv import load_dotenv

load_dotenv()

host = os.getenv("POSTGRES_HOST", "localhost")
port = int(os.getenv("POSTGRES_PORT", "5432"))
user = os.getenv("POSTGRES_USER", "postgres")
password = os.getenv("POSTGRES_PASSWORD", "")
target_db = os.getenv("POSTGRES_DB", "crmDb")
admin_db = os.getenv("POSTGRES_ADMIN_DB", "postgres")


def try_connect(pwd: str):
    return psycopg2.connect(
        host=host,
        port=port,
        user=user,
        password=pwd,
        dbname=admin_db,
    )


conn = None
try:
    conn = try_connect(password)
except Exception:
    print("Stored credentials failed. Please enter PostgreSQL password.")
    try:
        entered = getpass.getpass(f"Password for {user}: ")
    except EOFError:
        print("No interactive prompt available. Set POSTGRES_PASSWORD in backend/.env and retry.", file=sys.stderr)
        sys.exit(1)

    try:
        conn = try_connect(entered)
        password = entered
    except Exception as exc:
        print(f"Cannot connect to PostgreSQL: {exc}", file=sys.stderr)
        sys.exit(1)

conn.autocommit = True
cur = conn.cursor()
cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (target_db,))
exists = cur.fetchone() is not None

if exists:
    print(f"Database '{target_db}' already exists")
else:
    cur.execute(f'CREATE DATABASE "{target_db}"')
    print(f"Database '{target_db}' created")

cur.close()
conn.close()

with open(".env", "w", encoding="utf-8") as f:
    f.write(f"POSTGRES_USER={user}\n")
    f.write(f"POSTGRES_PASSWORD={password}\n")
    f.write(f"POSTGRES_HOST={host}\n")
    f.write(f"POSTGRES_PORT={port}\n")
    f.write(f"POSTGRES_DB={target_db}\n")

print("Updated backend/.env with working credentials")
