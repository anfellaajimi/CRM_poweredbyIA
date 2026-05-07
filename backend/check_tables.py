import os
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

load_dotenv()

user = os.getenv("POSTGRES_USER")
password = os.getenv("POSTGRES_PASSWORD")
host = os.getenv("POSTGRES_HOST")
port = os.getenv("POSTGRES_PORT")
db = os.getenv("POSTGRES_DB")

url = f"postgresql://{user}:{password}@{host}:{port}/{db}"
engine = create_engine(url)
inspector = inspect(engine)
tables = inspector.get_table_names()

print("Tables found:")
for table in tables:
    print(f"- {table}")

if "ml_predictions" in tables:
    print("\nSUCCESS: ml_predictions table exists.")
else:
    print("\nFAILURE: ml_predictions table NOT found.")
