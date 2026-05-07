from fastapi import APIRouter

from app.api.v1.endpoints.acces import router as acces_router
from app.api.v1.endpoints.ai_monitoring import router as ai_monitoring_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.cahier_de_charge import router as cahier_router
from app.api.v1.endpoints.clients import router as clients_router
from app.api.v1.endpoints.contrats import router as contrats_router
from app.api.v1.endpoints.dashboard import router as dashboard_router
from app.api.v1.endpoints.devis import router as devis_router
from app.api.v1.endpoints.factures import router as factures_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.projets import router as projets_router
from app.api.v1.endpoints.projet_extras import router as projet_extras_router
from app.api.v1.endpoints.rappels import router as rappels_router
from app.api.v1.endpoints.ressources import router as ressources_router
from app.api.v1.endpoints.services import router as services_router
from app.api.v1.endpoints.settings import router as settings_router
from app.api.v1.endpoints.user_contracts import router as user_contracts_router
from app.api.v1.endpoints.utilisateurs import router as utilisateurs_router
from app.api.v1.endpoints.messages import router as messages_router
from app.api.v1.endpoints.declaration_cnss import router as declaration_cnss_router
from app.api.v1.endpoints.ml_predictions import router as ml_predictions_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(clients_router)
api_router.include_router(projets_router)
api_router.include_router(projet_extras_router)
api_router.include_router(dashboard_router)
api_router.include_router(ressources_router)
api_router.include_router(utilisateurs_router)
api_router.include_router(user_contracts_router)
api_router.include_router(declaration_cnss_router)
api_router.include_router(services_router)
api_router.include_router(acces_router)
api_router.include_router(rappels_router)
api_router.include_router(ai_monitoring_router)
api_router.include_router(devis_router)
api_router.include_router(factures_router)
api_router.include_router(contrats_router)
api_router.include_router(cahier_router)
api_router.include_router(messages_router)
api_router.include_router(ml_predictions_router)
api_router.include_router(settings_router, prefix="/settings", tags=["settings"])
