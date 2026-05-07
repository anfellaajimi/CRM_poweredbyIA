from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.ml_service import MLService
from app.models.ml_prediction import MLPrediction

router = APIRouter(prefix="/predictions", tags=["ML Predictions"])

@router.get("/revenue")
def get_revenue_predictions(db: Session = Depends(get_db)):
    # Try to get from DB first, if none, run once
    preds = db.query(MLPrediction).filter(MLPrediction.prediction_type == "revenue").all()
    if not preds:
        MLService.run_all_predictions(db)
        preds = db.query(MLPrediction).filter(MLPrediction.prediction_type == "revenue").all()
    
    return preds

@router.get("/projects")
def get_projects_predictions(db: Session = Depends(get_db)):
    preds = db.query(MLPrediction).filter(MLPrediction.prediction_type == "projects").all()
    if not preds:
        MLService.run_all_predictions(db)
        preds = db.query(MLPrediction).filter(MLPrediction.prediction_type == "projects").all()
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
    MLService.run_all_predictions(db)
    return {"message": "Recalculation successful"}
