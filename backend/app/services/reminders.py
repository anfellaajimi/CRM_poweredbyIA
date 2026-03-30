from __future__ import annotations

import unicodedata
from dataclasses import dataclass
from datetime import date, datetime, timedelta

from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.models.devis import Devis
from app.models.facture import Facture
from app.models.projet import Projet
from app.models.projet_milestone import ProjetMilestone
from app.models.rappel import Rappel
from app.services.email import send_email


OFFSETS_DAYS = (7, 3, 1)


def _norm_status(s: str | None) -> str:
    raw = (s or "").strip().lower()
    # Normalize accents: "terminé" -> "termine", "payée" -> "payee"
    nfkd = unicodedata.normalize("NFKD", raw)
    return "".join(ch for ch in nfkd if not unicodedata.combining(ch))


def _is_project_done(status: str | None) -> bool:
    s = _norm_status(status)
    return s in {"termine", "completed", "done", "finished"}


def _is_devis_open(status: str | None) -> bool:
    s = _norm_status(status)
    return s in {"draft", "sent"}


def _is_invoice_paid(status: str | None) -> bool:
    s = _norm_status(status)
    return s in {"payee", "paid"}


def _date_only(dt: datetime | date | None) -> date | None:
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt.date()
    return dt


def _mk_system_key(kind: str, projet_id: int, suffix: str) -> str:
    return f"project:{projet_id}:{kind}:{suffix}"


def _get_or_create_system_rappel(
    db: Session,
    *,
    system_key: str,
    client_id: int,
    projet_id: int,
    titre: str,
    message: str,
    date_rappel: datetime | None,
    priorite: str = "moyenne",
    devis_id: int | None = None,
    facture_id: int | None = None,
    milestone_id: int | None = None,
) -> Rappel:
    existing = db.query(Rappel).filter(Rappel.systemKey == system_key).first()
    if existing:
        # Keep it up-to-date but do not overwrite manual completion.
        if _norm_status(existing.statut) != "termine":
            existing.titre = titre
            existing.message = message
            existing.dateRappel = date_rappel
            existing.priorite = priorite
            existing.clientID = client_id
            existing.projetID = projet_id
            existing.devisID = devis_id
            existing.factureID = facture_id
            existing.milestoneID = milestone_id
        return existing

    item = Rappel(
        clientID=client_id,
        projetID=projet_id,
        devisID=devis_id,
        factureID=facture_id,
        milestoneID=milestone_id,
        titre=titre,
        typeRappel="system",
        dateRappel=date_rappel,
        message=message,
        statut="en_attente",
        priorite=priorite,
        systemKey=system_key,
        emailSentAt=None,
        emailLastError=None,
    )
    db.add(item)
    return item


def _mark_done(db: Session, system_key: str) -> None:
    item = db.query(Rappel).filter(Rappel.systemKey == system_key).first()
    if item and _norm_status(item.statut) != "termine":
        item.statut = "termine"


def generate_project_rappels(db: Session, now: datetime) -> dict:
    """
    Generate project-scoped system reminders idempotently (via systemKey).
    Returns basic counts for logging/monitoring.
    """
    today = now.date()

    created_or_updated = 0
    marked_done = 0

    projects: list[Projet] = db.query(Projet).all()
    for p in projects:
        client_id = p.clientID
        projet_id = p.id

        start_date = _date_only(p.dateDebut)
        end_date = _date_only(p.dateFin)

        # Timeline: start upcoming (1 day before)
        if start_date:
            target = start_date - timedelta(days=1)
            key = _mk_system_key("start", projet_id, target.isoformat())
            if target == today:
                _get_or_create_system_rappel(
                    db,
                    system_key=key,
                    client_id=client_id,
                    projet_id=projet_id,
                    titre=f"Demarrage du projet demain - {p.nomProjet}",
                    message=f'Le projet "{p.nomProjet}" demarre demain ({start_date.isoformat()}).',
                    date_rappel=datetime.combine(today, datetime.min.time()),
                    priorite="moyenne",
                )
                created_or_updated += 1
            elif target < today:
                _mark_done(db, key)

        # Timeline: deadline approaching (7/3/1 days before end date)
        if end_date:
            for off in OFFSETS_DAYS:
                target = end_date - timedelta(days=off)
                key = _mk_system_key("deadline", projet_id, f"{off}:{end_date.isoformat()}")
                if target == today:
                    _get_or_create_system_rappel(
                        db,
                        system_key=key,
                        client_id=client_id,
                        projet_id=projet_id,
                        titre=f"Deadline proche ({off}j) - {p.nomProjet}",
                        message=f"Le projet \"{p.nomProjet}\" se termine le {end_date.isoformat()} (dans {off} jour(s)).",
                        date_rappel=datetime.combine(today, datetime.min.time()),
                        priorite="elevee" if off <= 3 else "moyenne",
                    )
                    created_or_updated += 1
                elif target < today:
                    _mark_done(db, key)

        # Milestones overdue
        milestones = (
            db.query(ProjetMilestone)
            .filter(ProjetMilestone.projetID == projet_id)
            .all()
        )
        for m in milestones:
            due = _date_only(m.dueDate)
            if not due:
                continue
            done = _norm_status(m.status) in {"done", "termine"}
            key = _mk_system_key("milestone_overdue", projet_id, str(m.id))
            if done:
                before = db.query(Rappel).filter(Rappel.systemKey == key, Rappel.statut != "termine").count()
                _mark_done(db, key)
                if before:
                    marked_done += 1
                continue
            if due < today:
                _get_or_create_system_rappel(
                    db,
                    system_key=key,
                    client_id=client_id,
                    projet_id=projet_id,
                    titre=f"Jalon en retard - {m.title}",
                    message=f'Le jalon "{m.title}" est en retard (echeance {due.isoformat()}).',
                    date_rappel=datetime.combine(today, datetime.min.time()),
                    priorite="elevee",
                    milestone_id=m.id,
                )
                created_or_updated += 1

        # Financial: invoice not generated when project is done
        key_invoice_missing = _mk_system_key("invoice_missing", projet_id, "done_no_invoice")
        if _is_project_done(p.status):
            # exists any facture linked to project via association relationship
            has_invoice = bool(getattr(p, "factures", None)) and len(p.factures) > 0
            if not has_invoice:
                _get_or_create_system_rappel(
                    db,
                    system_key=key_invoice_missing,
                    client_id=client_id,
                    projet_id=projet_id,
                    titre=f"Facture manquante â€” {p.nomProjet}",
                    message=f'Le projet "{p.nomProjet}" est termine mais aucune facture n\'est liee.',
                    date_rappel=datetime.combine(today, datetime.min.time()),
                    priorite="moyenne",
                )
                created_or_updated += 1
            else:
                before = db.query(Rappel).filter(Rappel.systemKey == key_invoice_missing, Rappel.statut != "termine").count()
                _mark_done(db, key_invoice_missing)
                if before:
                    marked_done += 1
        else:
            before = db.query(Rappel).filter(Rappel.systemKey == key_invoice_missing, Rappel.statut != "termine").count()
            _mark_done(db, key_invoice_missing)
            if before:
                marked_done += 1

        # Financial: budget threshold exceeded
        key_budget = _mk_system_key("budget_exceeded", projet_id, "budget")
        try:
            budget = float(p.budget) if p.budget is not None else None
            spent = float(p.depense) if p.depense is not None else 0.0
        except Exception:
            budget = None
            spent = 0.0
        if budget is not None and spent > budget:
            _get_or_create_system_rappel(
                db,
                system_key=key_budget,
                client_id=client_id,
                projet_id=projet_id,
                titre=f"Budget depasse - {p.nomProjet}",
                message=f"Depenses {spent:.2f} > Budget {budget:.2f}.",
                date_rappel=datetime.combine(today, datetime.min.time()),
                priorite="elevee",
            )
            created_or_updated += 1
        else:
            before = db.query(Rappel).filter(Rappel.systemKey == key_budget, Rappel.statut != "termine").count()
            _mark_done(db, key_budget)
            if before:
                marked_done += 1

        # Financial: devis expiring (7/3/1 days)
        devis_list: list[Devis] = (
            db.query(Devis)
            .filter(Devis.projetID == projet_id)
            .all()
        )
        for d in devis_list:
            valid_date = _date_only(d.validUntil)
            if not valid_date or not _is_devis_open(d.status):
                # If previously generated, mark done
                if valid_date:
                    for off in OFFSETS_DAYS:
                        key = _mk_system_key("devis_expiring", projet_id, f"{d.devisID}:{off}:{valid_date.isoformat()}")
                        before = db.query(Rappel).filter(Rappel.systemKey == key, Rappel.statut != "termine").count()
                        _mark_done(db, key)
                        if before:
                            marked_done += 1

                        legacy_key = _mk_system_key("devis_expiring", projet_id, f"{d.devisID}:{off}")
                        before_legacy = (
                            db.query(Rappel)
                            .filter(Rappel.systemKey == legacy_key, Rappel.statut != "termine")
                            .count()
                        )
                        _mark_done(db, legacy_key)
                        if before_legacy:
                            marked_done += 1
                continue

            for off in OFFSETS_DAYS:
                target = valid_date - timedelta(days=off)
                key = _mk_system_key("devis_expiring", projet_id, f"{d.devisID}:{off}:{valid_date.isoformat()}")
                if target == today:
                    _get_or_create_system_rappel(
                        db,
                        system_key=key,
                        client_id=client_id,
                        projet_id=projet_id,
                        titre=f"Devis expire bientot ({off}j) - {p.nomProjet}",
                        message=f"Le devis #{d.devisID} expire le {valid_date.isoformat()} (dans {off} jour(s)).",
                        date_rappel=datetime.combine(today, datetime.min.time()),
                        priorite="moyenne",
                        devis_id=d.devisID,
                    )
                    created_or_updated += 1
                elif target < today:
                    _mark_done(db, key)

        # Financial: unpaid invoices linked to project (due soon / overdue)
        invoices: list[Facture] = []
        try:
            invoices = list(p.factures)
        except Exception:
            invoices = []

        for inv in invoices:
            if _is_invoice_paid(inv.status):
                # mark all keys done
                due = _date_only(inv.dueDate)
                for off in OFFSETS_DAYS:
                    if due:
                        key = _mk_system_key("invoice_unpaid", projet_id, f"{inv.factureID}:{off}:{due.isoformat()}")
                    else:
                        key = _mk_system_key("invoice_unpaid", projet_id, f"{inv.factureID}:{off}")
                    before = db.query(Rappel).filter(Rappel.systemKey == key, Rappel.statut != "termine").count()
                    _mark_done(db, key)
                    if before:
                        marked_done += 1
                if due:
                    key_overdue = _mk_system_key("invoice_unpaid_overdue", projet_id, f"{inv.factureID}:{due.isoformat()}")
                else:
                    key_overdue = _mk_system_key("invoice_unpaid_overdue", projet_id, str(inv.factureID))
                before = db.query(Rappel).filter(Rappel.systemKey == key_overdue, Rappel.statut != "termine").count()
                _mark_done(db, key_overdue)
                if before:
                    marked_done += 1
                continue

            due = _date_only(inv.dueDate)
            if due:
                for off in OFFSETS_DAYS:
                    target = due - timedelta(days=off)
                    key = _mk_system_key("invoice_unpaid", projet_id, f"{inv.factureID}:{off}:{due.isoformat()}")
                    if target == today:
                        _get_or_create_system_rappel(
                            db,
                            system_key=key,
                            client_id=client_id,
                            projet_id=projet_id,
                            titre=f"Facture impayee ({off}j) - #{inv.factureID}",
                            message=f"La facture #{inv.factureID} arrive a echeance le {due.isoformat()} (dans {off} jour(s)).",
                            date_rappel=datetime.combine(today, datetime.min.time()),
                            priorite="elevee" if off <= 3 else "moyenne",
                            facture_id=inv.factureID,
                        )
                        created_or_updated += 1
                    elif target < today:
                        _mark_done(db, key)

                if due < today:
                    key_overdue = _mk_system_key("invoice_unpaid_overdue", projet_id, f"{inv.factureID}:{due.isoformat()}")
                    _get_or_create_system_rappel(
                        db,
                        system_key=key_overdue,
                        client_id=client_id,
                        projet_id=projet_id,
                        titre=f"Facture en retard â€” #{inv.factureID}",
                        message=f"La facture #{inv.factureID} est en retard depuis le {due.isoformat()}.",
                        date_rappel=datetime.combine(today, datetime.min.time()),
                        priorite="elevee",
                        facture_id=inv.factureID,
                    )
                    created_or_updated += 1

    db.commit()

    return {"created_or_updated": created_or_updated, "marked_done": marked_done}


def send_due_reminder_emails(db: Session, now: datetime) -> dict:
    """
    Send emails for reminders that are due today and haven't been emailed yet.
    """
    today = now.date()

    to_send: list[Rappel] = (
        db.query(Rappel)
        .filter(
            Rappel.dateRappel.isnot(None),
            func.date(Rappel.dateRappel) <= today,
            Rappel.emailSentAt.is_(None),
            Rappel.statut != "termine",
        )
        .order_by(Rappel.id.asc())
        .all()
    )

    sent = 0
    failed = 0

    for r in to_send:
        recipients: set[str] = set()

        kind = None
        if r.systemKey:
            parts = r.systemKey.split(":")
            if len(parts) >= 4 and parts[0] == "project":
                kind = parts[2]

        # Recipient policy:
        # - Timeline/budget/milestone/invoice-missing -> team only
        # - Unpaid invoice / devis expiring -> client + team
        # - Manual reminders -> client (+ team if project-linked)
        send_client = True
        send_team = True
        if kind in {"deadline", "start", "budget_exceeded", "milestone_overdue", "invoice_missing"}:
            send_client = False
        elif kind in {"invoice_unpaid", "invoice_unpaid_overdue", "devis_expiring"}:
            send_client = True
            send_team = True
        else:
            # manual / unknown kinds
            send_team = bool(getattr(r, "projetID", None))

        if send_client and r.client and getattr(r.client, "email", None):
            recipients.add(r.client.email)

        # team emails for project
        try:
            if send_team and r.projet and getattr(r.projet, "utilisateurs", None):
                for u in r.projet.utilisateurs:
                    if getattr(u, "email", None):
                        recipients.add(u.email)
        except Exception:
            pass

        if not recipients:
            r.emailSentAt = now
            r.emailLastError = "No recipients"
            failed += 1
            continue

        subject = f"[CRM] {r.titre}"
        body = (r.message or "").strip() or r.titre

        last_error = None
        ok_any = False
        for email in sorted(recipients):
            res = send_email(email, subject=subject, body=body)
            if res.ok:
                ok_any = True
            else:
                last_error = res.error

        if ok_any:
            r.emailSentAt = now
            r.emailLastError = last_error
            sent += 1
        else:
            r.emailLastError = last_error or "Unknown error"
            failed += 1

    db.commit()
    return {"emails_sent": sent, "emails_failed": failed, "candidates": len(to_send)}
