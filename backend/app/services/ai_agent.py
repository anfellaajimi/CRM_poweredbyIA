from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

from sqlalchemy.orm import Session, joinedload

from app.api.v1.endpoints._activity import log_activity
from app.core.config import settings
from app.models.facture import Facture
from app.models.projet import Projet
from app.models.rappel import Rappel
from app.services.reminders import send_due_reminder_emails


@dataclass
class AgentAlert:
    projet_id: int | None
    client_id: int
    severity: str
    title: str
    message: str
    key_suffix: str


def _is_done_status(status: str | None) -> bool:
    s = (status or "").strip().lower()
    return s in {"termine", "terminé", "done", "completed", "finished"}


def _upsert_alert(db: Session, alert: AgentAlert, now: datetime) -> None:
    key_project = alert.projet_id if alert.projet_id is not None else "no-project"
    system_key = f"ai-agent:{key_project}:{alert.key_suffix}"
    existing = db.query(Rappel).filter(Rappel.systemKey == system_key).first()
    if existing:
        if existing.statut != "termine":
            existing.titre = alert.title
            existing.message = alert.message
            existing.priorite = "elevee" if alert.severity == "critical" else "moyenne"
            existing.dateRappel = now
        return

    db.add(
        Rappel(
            clientID=alert.client_id,
            projetID=alert.projet_id,
            titre=alert.title,
            typeRappel="system",
            dateRappel=now,
            message=alert.message,
            statut="en_attente",
            priorite="elevee" if alert.severity == "critical" else "moyenne",
            systemKey=system_key,
        )
    )


def _project_activity_status(project: Projet, now: datetime) -> tuple[str, datetime | None]:
    last_note_at = max((n.createdAt for n in project.notes), default=None)
    if last_note_at is None:
        return "inactive", None
    days_since_note = (now - last_note_at).days
    if days_since_note >= 14:
        return "inactive", last_note_at
    return "active", last_note_at


def _detect_project_alerts(project: Projet, now: datetime) -> list[AgentAlert]:
    alerts: list[AgentAlert] = []
    activity, last_note_at = _project_activity_status(project, now)
    last_note_days = (now - last_note_at).days if last_note_at else 9999

    if activity == "inactive":
        sev = "critical" if last_note_days >= 21 else "warning"
        alerts.append(
            AgentAlert(
                projet_id=project.id,
                client_id=project.clientID,
                severity=sev,
                title=f"Projet inactif - {project.nomProjet}",
                message=f"Le projet n'a pas de note recente ({last_note_days} jours).",
                key_suffix="inactive",
            )
        )

    if not _is_done_status(project.status):
        if last_note_days >= 7:
            sev = "critical" if last_note_days >= 14 else "warning"
            alerts.append(
                AgentAlert(
                    projet_id=project.id,
                    client_id=project.clientID,
                    severity=sev,
                    title=f"Mise a jour manquante - {project.nomProjet}",
                    message=f"Aucune mise a jour projet depuis {last_note_days} jours.",
                    key_suffix=f"missing-updates-{sev}",
                )
            )

        if project.dateFin and project.dateFin < now.date():
            alerts.append(
                AgentAlert(
                    projet_id=project.id,
                    client_id=project.clientID,
                    severity="critical",
                    title=f"Retard projet - {project.nomProjet}",
                    message=f"Date de fin depassee ({project.dateFin.isoformat()}) et projet non termine.",
                    key_suffix="delay",
                )
            )

        if project.progression <= 30 and last_note_days >= 10:
            alerts.append(
                AgentAlert(
                    projet_id=project.id,
                    client_id=project.clientID,
                    severity="warning",
                    title=f"Pattern inhabituel - {project.nomProjet}",
                    message=f"Progression faible ({project.progression}%) avec activite faible.",
                    key_suffix="unusual-pattern",
                )
            )
    return alerts


def _billing_alerts(db: Session, now: datetime) -> list[AgentAlert]:
    alerts: list[AgentAlert] = []
    invoices = (
        db.query(Facture)
        .options(joinedload(Facture.projets))
        .all()
    )
    paid_statuses = {"payee", "payée", "paid"}
    for inv in invoices:
        status = (inv.status or "").strip().lower()
        if status in paid_statuses or inv.paymentDate is not None or inv.dueDate is None:
            continue

        days_to_due = (inv.dueDate.date() - now.date()).days
        linked_project = inv.projets[0] if inv.projets else None
        project_id = linked_project.id if linked_project else None
        client_id = inv.clientID
        if days_to_due < 0:
            alerts.append(
                AgentAlert(
                    projet_id=project_id,
                    client_id=client_id,
                    severity="critical",
                    title=f"Facture impayee en retard #{inv.factureID}",
                    message=f"La facture est depassee depuis {-days_to_due} jours.",
                    key_suffix=f"invoice-overdue-{inv.factureID}",
                )
            )
        elif days_to_due <= 2:
            alerts.append(
                AgentAlert(
                    projet_id=project_id,
                    client_id=client_id,
                    severity="warning",
                    title=f"Facture bientot echeance #{inv.factureID}",
                    message=f"La facture arrive a echeance dans {days_to_due} jour(s).",
                    key_suffix=f"invoice-due-{inv.factureID}",
                )
            )
    return alerts


def _auto_resolve_low_severity_alerts(db: Session, now: datetime) -> int:
    minutes = max(0, int(settings.AI_AGENT_AUTO_RESOLVE_LOW_MINUTES or 0))
    if minutes <= 0:
        return 0

    threshold = now - timedelta(minutes=minutes)
    to_resolve = (
        db.query(Rappel)
        .filter(
            Rappel.systemKey.like("ai-agent:%"),
            Rappel.statut != "termine",
            Rappel.priorite != "elevee",
            Rappel.createdAt <= threshold,
        )
        .all()
    )
    count = 0
    for alert in to_resolve:
        alert.statut = "termine"
        alert.resolvedAt = now
        count += 1
        log_activity(
            db,
            entity_type="ai_agent",
            entity_id=alert.projetID,
            action="auto_resolve",
            message=f"[AI Agent] Auto-résolution de l'alerte faible sévérité #{alert.id}",
            actor="AI Agent",
        )
    return count


def run_ai_agent(db: Session, now: datetime | None = None) -> dict:
    now = now or datetime.utcnow()
    
    log_activity(
        db,
        entity_type="ai_agent",
        entity_id=None,
        action="run",
        message="[AI Agent] Lancement du cycle de supervision complet.",
        actor="AI Agent",
    )

    projects = (
        db.query(Projet)
        .options(joinedload(Projet.notes))
        .all()
    )

    alerts: list[AgentAlert] = []
    status_summary = {"active": 0, "inactive": 0}
    for project in projects:
        activity, _ = _project_activity_status(project, now)
        status_summary[activity] += 1
        alerts.extend(_detect_project_alerts(project, now))
        log_activity(
            db, 
            entity_type="ai_agent", 
            entity_id=project.id, 
            action="project_analysis", 
            message=f"[AI Agent] Analyse du projet: {project.nomProjet}", 
            actor="AI Agent"
        )

    invoices = db.query(Facture).all()
    for inv in invoices:
        log_activity(
            db,
            entity_type="ai_agent",
            entity_id=inv.factureID,
            action="billing_check",
            message=f"[AI Agent] Vérification facture #{inv.factureID}",
            actor="AI Agent"
        )
    alerts.extend(_billing_alerts(db, now))

    warning_count = 0
    critical_count = 0
    for alert in alerts:
        if alert.severity == "critical":
            critical_count += 1
        else:
            warning_count += 1
        _upsert_alert(db, alert, now)
        log_activity(
            db,
            entity_type="ai_agent",
            entity_id=alert.projet_id if isinstance(alert.projet_id, int) and alert.projet_id > 0 else None,
            action=alert.severity,
            message=f"[AI Agent] {alert.title}: {alert.message}",
            actor="AI Agent",
        )

    auto_resolved = _auto_resolve_low_severity_alerts(db, now)
    db.commit()

    # Billing communication automation: send due reminder emails right after run.
    email_result = send_due_reminder_emails(db, now=now)

    return {
        "ranAt": now.isoformat(),
        "projectStatusSummary": status_summary,
        "alerts": [
            {
                "projectId": a.projet_id,
                "clientId": a.client_id,
                "severity": a.severity,
                "title": a.title,
                "message": a.message,
            }
            for a in alerts
        ],
        "counts": {
            "warning": warning_count,
            "critical": critical_count,
            "total": len(alerts),
            "autoResolvedLowSeverity": auto_resolved,
        },
        "email": email_result,
    }
