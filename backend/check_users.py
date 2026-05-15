import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.models.client_portal_user import ClientPortalUser
from app.models.client import Client

db = SessionLocal()
try:
    users = db.query(ClientPortalUser).all()
    print(f"Total client users: {len(users)}")
    for u in users:
        print(f"- {u.email} (Active: {u.isActive})")
    
    clients = db.query(Client).all()
    print(f"\nAvailable clients for signup:")
    for c in clients:
        print(f"- {c.nom} ({c.email})")
finally:
    db.close()
