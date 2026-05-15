from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.ml_service import MLService
from app.models.ml_prediction import MLPrediction
import requests
from pydantic import BaseModel
from app.core.config import settings

class ChatPrompt(BaseModel):
    message: str



router = APIRouter(prefix="/predictions", tags=["ML Predictions"])

@router.get("/revenue")
def get_revenue_predictions(db: Session = Depends(get_db)):
    # Try to get from DB first, if none, run once
    preds = db.query(MLPrediction).filter(MLPrediction.prediction_type == "revenue").order_by(MLPrediction.period.asc()).all()
    if not preds:
        MLService.run_all_predictions(db)
        preds = db.query(MLPrediction).filter(MLPrediction.prediction_type == "revenue").order_by(MLPrediction.period.asc()).all()
    
    return preds

@router.get("/projects")
def get_projects_predictions(db: Session = Depends(get_db)):
    preds = db.query(MLPrediction).filter(MLPrediction.prediction_type == "projects").order_by(MLPrediction.period.asc()).all()
    if not preds:
        MLService.run_all_predictions(db)
        preds = db.query(MLPrediction).filter(MLPrediction.prediction_type == "projects").order_by(MLPrediction.period.asc()).all()
    return preds

@router.get("/risks")
def get_risk_predictions(db: Session = Depends(get_db)):
    pred = db.query(MLPrediction).filter(MLPrediction.prediction_type == "risk", MLPrediction.period == "current").first()
    if not pred:
        MLService.run_all_predictions(db)
        pred = db.query(MLPrediction).filter(MLPrediction.prediction_type == "risk", MLPrediction.period == "current").first()
    return pred.metadata_json.get('details', []) if pred else []

@router.get("/performance")
def get_performance_predictions(db: Session = Depends(get_db)):
    pred = db.query(MLPrediction).filter(MLPrediction.prediction_type == "performance", MLPrediction.period == "current").first()
    if not pred:
        MLService.run_all_predictions(db)
        pred = db.query(MLPrediction).filter(MLPrediction.prediction_type == "performance", MLPrediction.period == "current").first()
    return pred.metadata_json.get('details', []) if pred else []

@router.post("/recalculate")
def recalculate_predictions(db: Session = Depends(get_db)):
    try:
        MLService.run_all_predictions(db)
        return {"message": "Recalculation successful"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/smart-recommendations")
def get_smart_recommendations(db: Session = Depends(get_db)):
    health = MLService.calculate_health_score(db)
    risks = MLService.predict_risks(db)
    
    recommendations = []
    
    # 1. Dev resources recommendation
    high_risk_projects = [r for r in risks if r['risk_level'] == 'High']
    if len(high_risk_projects) > 1:
        recommendations.append({
            "id": 1,
            "title": "Ajouter 1 developpeur backend",
            "description": f"Surcharge detectee sur {len(high_risk_projects)} projets critiques.",
            "priority": "Urgent",
            "type": "resource"
        })
    elif health['current_score'] < 60:
        recommendations.append({
            "id": 2,
            "title": "Renforcer l'equipe",
            "description": "Le score de sante global est faible.",
            "priority": "Important",
            "type": "resource"
        })
        
    # 2. Delay recommendation
    delayed = [r for r in risks if any("Date limite" in reason for reason in r.get('reasons', []))]
    if delayed:
        recommendations.append({
            "id": 3,
            "title": f"Delai projet '{delayed[0]['project_name']}' insuffisant",
            "description": "Risque majeur de retard de livraison.",
            "priority": "Urgent",
            "type": "time"
        })
        
    # 3. Client risk
    if len(risks) > 0:
        recommendations.append({
            "id": 4,
            "title": "Client 'FinanceTech' a risque de depart",
            "description": "Score de satisfaction en baisse due aux retards.",
            "priority": "Important",
            "type": "client"
        })
        
    # 4. Burnout risk
    devs = MLService.predict_dev_insights(db)
    burnout_devs = [d for d in devs if d['burnout_risk_level'] == 'High']
    if burnout_devs:
        recommendations.append({
            "id": 5,
            "title": "Charge equipe trop elevee",
            "description": f"{len(burnout_devs)} developpeur(s) en risque de burnout.",
            "priority": "Urgent",
            "type": "team"
        })
    
    if len(recommendations) < 4:
        recommendations.append({
            "id": 6,
            "title": "Optimisation des processus",
            "description": "Mettre en place des revues de code plus frequentes.",
            "priority": "Suggestion",
            "type": "process"
        })

    return recommendations

@router.get("/dev-insights")
def get_dev_insights(db: Session = Depends(get_db)):
    return MLService.predict_dev_insights(db)

@router.get("/budget-intelligence")
def get_budget_intelligence(db: Session = Depends(get_db)):
    return MLService.predict_budget_intelligence(db)

@router.get("/resource-optimization")
def get_resource_optimization(db: Session = Depends(get_db)):
    return MLService.predict_resource_allocation(db)



@router.post("/chat")
def predictive_chat(prompt: ChatPrompt, db: Session = Depends(get_db)):
    health = MLService.calculate_health_score(db)
    score = health['current_score']
    
    rev = MLService.predict_revenue(db)
    next_month_ca = rev['predictions'][0]['value'] if rev['predictions'] else 0
    
    risks = MLService.predict_risks(db)
    high_risk_projects = [r['project_name'] for r in risks if r['risk_level'] == 'High']
    risk_text = f"{len(high_risk_projects)} ({', '.join(high_risk_projects)})" if high_risk_projects else "0"
    
    devs = MLService.predict_dev_insights(db)
    high_burnout_devs = [d['name'] for d in devs if d['burnout_risk_level'] == 'High']
    burnout_text = f"{len(high_burnout_devs)} ({', '.join(high_burnout_devs)})" if high_burnout_devs else "0"
    
    system_prompt = f"""Tu es un assistant IA expert en analyse de CRM. Voici les donnees actuelles de l'entreprise :
- CA prevu le mois prochain : {next_month_ca:,.2f} DT
- Health Score : {score:.1f}/100
- Projets a risque eleve : {risk_text}
- Developpeurs en surcharge (risque burnout) : {burnout_text}

Reponds en francais avec des chiffres precis bases sur ces donnees. Sois concis et professionnel."""

    groq_key = settings.GROQ_API_KEY
    if not groq_key:
        return {"reply": "Erreur: La cle API Groq n'est pas configuree dans le backend."}

    url = "https://api.groq.com/openai/v1/chat/completions"
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt.message}
        ],
        "temperature": 0.2
    }
    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json",
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        reply_text = data["choices"][0]["message"]["content"]
        return {"reply": reply_text}
    except Exception as e:
        return {"reply": f"Desole, une erreur est survenue lors de la communication avec Groq: {str(e)}"}


