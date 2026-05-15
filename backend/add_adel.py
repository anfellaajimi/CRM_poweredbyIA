import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.models.client import Client

db = SessionLocal()
try:
    client = db.query(Client).filter(Client.email == "clientadel@test.com").first()
    if not client:
        print("Adding clientadel@test.com to clients table...")
        client = Client(
            nom="Adel Client",
            email="clientadel@test.com",
            typeClient="moral",
            status="actif"
        )
        db.add(client)
        db.commit()
        print("Success.")
    else:
        print("Client already exists.")
finally:
    db.close()
