from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.activity_event import ActivityEvent
from app.models.client import Client
from app.models.facture import Facture
from app.models.monitoring import AIMonitoring
from app.models.projet import Projet
from app.models.rappel import Rappel
from app.schemas.dashboard import (
    ActivityItem,
    ClientGrowthPoint,
    DashboardKPI,
    DashboardOverview,
    MonitoringSummary,
    ProjectStatusPoint,
    ReminderItem,
    RevenuePoint,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/overview", response_model=DashboardOverview)
def get_dashboard_overview(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    year = now.year

    total_clients = db.query(func.count(Client.id)).scalar() or 0
    active_projects = db.query(func.count(Projet.id)).filter(Projet.status.in_(["en_cours", "En cours", "In Progress"])).scalar() or 0
    pending_invoices = db.query(func.count(Facture.factureID)).filter(Facture.status.in_(["en_attente", "pending", "Impayée"])).scalar() or 0
    monthly_revenue = db.query(func.coalesce(func.sum(Facture.amountTTC), 0)).filter(extract("month", Facture.dateFacture) == now.month).scalar() or 0

    revenues = (
        db.query(extract("month", Facture.dateFacture).label("month"), func.coalesce(func.sum(Facture.amountTTC), 0).label("total"))
        .filter(extract("year", Facture.dateFacture) == year)
        .group_by("month")
        .all()
    )
    revenue_map = {int(r.month): float(r.total) for r in revenues}
    revenue_data = [RevenuePoint(month=f"{m:02d}", revenue=revenue_map.get(m, 0.0)) for m in range(1, 13)]

    project_statuses = db.query(Projet.status, func.count(Projet.id)).group_by(Projet.status).all()
    project_status_data = [ProjectStatusPoint(name=status or "unknown", value=count) for status, count in project_statuses]

    clients_growth = (
        db.query(extract("month", Client.dateCreation).label("month"), func.count(Client.id).label("count"))
        .filter(extract("year", Client.dateCreation) == year)
        .group_by("month")
        .all()
    )
    growth_map = {int(c.month): int(c.count) for c in clients_growth}
    client_growth_data = [ClientGrowthPoint(month=f"{m:02d}", clients=growth_map.get(m, 0)) for m in range(1, 13)]

    activities_raw = db.query(ActivityEvent).order_by(ActivityEvent.createdAt.desc()).limit(5).all()
    activities = [
        ActivityItem(
            id=item.eventID,
            message=item.message,
            timestamp=item.createdAt.isoformat(),
            action=item.action,
        )
        for item in activities_raw
    ]

    reminders_raw = (
        db.query(Rappel)
        .filter(Rappel.statut.in_(["en_attente", "En attente"]))
        .order_by(Rappel.dateRappel.asc().nulls_last())
        .limit(5)
        .all()
    )
    reminders = [
        ReminderItem(
            id=item.id,
            title=item.message or item.typeRappel or f"Rappel {item.id}",
            dateLimite=item.dateRappel.isoformat() if item.dateRappel else None,
            priorite=item.priorite,
            statut=item.statut,
        )
        for item in reminders_raw
    ]

    monitoring_rows = db.query(AIMonitoring.status, func.count(AIMonitoring.monitoringID)).group_by(AIMonitoring.status).all()
    monitoring_counts = {status.lower(): count for status, count in monitoring_rows if status}
    monitoring_summary = MonitoringSummary(
        totalServices=sum(monitoring_counts.values()),
        healthy=monitoring_counts.get("healthy", 0) + monitoring_counts.get("en bon état", 0),
        warning=monitoring_counts.get("warning", 0) + monitoring_counts.get("avertissement", 0),
        critical=monitoring_counts.get("critical", 0),
    )

    return DashboardOverview(
        kpis=DashboardKPI(
            totalClients=total_clients,
            activeProjects=active_projects,
            monthlyRevenue=float(monthly_revenue),
            pendingInvoices=pending_invoices,
        ),
        revenueData=revenue_data,
        projectStatusData=project_status_data,
        clientGrowthData=client_growth_data,
        activities=activities,
        reminders=reminders,
        monitoring=monitoring_summary,
    )
