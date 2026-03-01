from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.config import settings
from app.db import base  # noqa: F401
from app.db.base_class import Base
from app.db.session import engine

openapi_tags = [
    {"name": "Health", "description": "Health and readiness endpoints."},
    {"name": "Auth", "description": "Authentication endpoints."},
    {"name": "Clients", "description": "Client management endpoints."},
    {"name": "Projets", "description": "Project management endpoints."},
    {"name": "Ressources", "description": "Project resource endpoints."},
    {"name": "Utilisateurs", "description": "Internal users endpoints."},
    {"name": "Services", "description": "Service lifecycle endpoints."},
    {"name": "Acces", "description": "Credentials and access endpoints."},
    {"name": "Rappels", "description": "Reminder endpoints."},
    {"name": "AI Monitoring", "description": "Monitoring endpoints for services."},
    {"name": "Devis", "description": "Quote and estimate endpoints."},
    {"name": "Factures", "description": "Invoice endpoints."},
    {"name": "Contrats", "description": "Contract endpoints."},
    {"name": "CahierDeCharge", "description": "Project requirements document endpoints."},
    {"name": "Dashboard", "description": "Dashboard aggregation endpoints."},
]

app = FastAPI(title=settings.APP_NAME, openapi_tags=openapi_tags)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.on_event("startup")
def startup_create_tables() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/", tags=["Health"])
def root():
    return {
        "name": settings.APP_NAME,
        "docs": "/docs",
    }
