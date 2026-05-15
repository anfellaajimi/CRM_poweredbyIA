import sys
import os
from datetime import datetime

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
        print(f"Adding data to client: {client.nom}")
        
        # Add a project
        new_project = Projet(
            nomProjet="Refonte Site Web Quatratech",
            description="Projet de refonte complète du site institutionnel.",
            status="en_cours",
            progression=65,
            clientID=client.id,
            dateDebut=datetime.utcnow().date()
        )
        db.add(new_project)
        
        # Add a facture
        new_facture = Facture(
            amountHT=2100.0,
            amountTTC=2500.0,
            status="en_attente",
            clientID=client.id,
            dateFacture=datetime.utcnow()
        )
        db.add(new_facture)
        
        db.commit()
        print("Data added successfully.")
finally:
    db.close()
