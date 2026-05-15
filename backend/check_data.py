import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.models.client import Client
from app.models.projet import Projet
from app.models.facture import Facture
from app.models.devis import Devis

db = SessionLocal()
try:
    client = db.query(Client).filter(Client.email == "client@test.com").first()
    if client:
        print(f"Client found: {client.nom} (ID: {client.id})")
        projects = db.query(Projet).filter(Projet.clientID == client.id).all()
        print(f"Projects: {len(projects)}")
        for p in projects:
            print(f"- {p.nomProjet} ({p.status})")
            
        factures = db.query(Facture).filter(Facture.clientID == client.id).all()
        print(f"Factures: {len(factures)}")
        
        devis = db.query(Devis).filter(Devis.clientID == client.id).all()
        print(f"Devis: {len(devis)}")
    else:
        print("Client client@test.com NOT found in clients table.")
finally:
    db.close()
