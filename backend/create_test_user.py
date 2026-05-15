import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.models.client_portal_user import ClientPortalUser
from app.models.client import Client
from app.core.security import get_password_hash

db = SessionLocal()
try:
    # 1. Check if client@test.com exists in clients table
    client = db.query(Client).filter(Client.email == "client@test.com").first()
    if not client:
        print("Creating test client...")
        client = Client(
            nom="Test Client",
            email="client@test.com",
            typeClient="moral",
            status="actif"
        )
        db.add(client)
        db.flush()
    
    # 2. Check if user exists in client_portal_users
    user = db.query(ClientPortalUser).filter(ClientPortalUser.email == "client@test.com").first()
    if not user:
        print("Creating test portal user...")
        user = ClientPortalUser(
            email="client@test.com",
            motDePasse=get_password_hash("password123"),
            clientID=client.id,
            isActive=True
        )
        db.add(user)
    else:
        print("Updating existing test portal user password...")
        user.motDePasse = get_password_hash("password123")
    
    db.commit()
    print("Test credentials ready:")
    print("Email: client@test.com")
    print("Password: password123")
finally:
    db.close()
