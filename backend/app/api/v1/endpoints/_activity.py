from sqlalchemy.orm import Session

from app.models.activity_event import ActivityEvent


def log_activity(
    db: Session,
    *,
    entity_type: str,
    entity_id: int | None,
    action: str,
    message: str,
    actor: str | None = None,
) -> None:
    db.add(
        ActivityEvent(
            entityType=entity_type,
            entityID=entity_id,
            action=action,
            message=message,
            actor=actor,
        )
    )
