import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import _TOKENS
from app.db.session import get_db
from app.models.message import Message
from app.models.utilisateur import Utilisateur
from app.schemas.message import ContactRead, MessageCreate, MessageRead

router = APIRouter(prefix="/messages", tags=["Chat"])

UPLOAD_ROOT = Path(__file__).resolve().parents[4] / "uploads" / "messages"
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)


def _last_message_preview(msg: Message | None) -> str | None:
    if not msg:
        return None
    if getattr(msg, "type", "text") == "audio":
        return "🎤 Message vocal"
    return msg.contenu


def _get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Utilisateur:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    token = authorization.split(" ", 1)[1].strip()
    user_id = _TOKENS.get(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.get(Utilisateur, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.get("/contacts", response_model=list[ContactRead])
def get_contacts(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(_get_current_user),
):
    """Return all other utilisateurs with their last message and unread count."""
    others = (
        db.query(Utilisateur)
        .filter(Utilisateur.userID != current_user.userID, Utilisateur.actif == True)  # noqa: E712
        .all()
    )

    result: list[ContactRead] = []
    for other in others:
        # Last message between the two users
        last_msg = (
            db.query(Message)
            .filter(
                or_(
                    and_(
                        Message.expediteurID == current_user.userID,
                        Message.destinataireID == other.userID,
                    ),
                    and_(
                        Message.expediteurID == other.userID,
                        Message.destinataireID == current_user.userID,
                    ),
                )
            )
            .order_by(Message.createdAt.desc())
            .first()
        )

        # Unread count (messages sent by this contact that I haven't read)
        unread_count = (
            db.query(Message)
            .filter(
                Message.expediteurID == other.userID,
                Message.destinataireID == current_user.userID,
                Message.lu == False,  # noqa: E712
            )
            .count()
        )

        result.append(
            ContactRead(
                userID=other.userID,
                nom=other.nom,
                role=other.role,
                lastMessage=_last_message_preview(last_msg),
                lastMessageTime=last_msg.createdAt if last_msg else None,
                unreadCount=unread_count,
            )
        )

    # Sort: contacts with messages first (by recency), then others
    from datetime import datetime as dt
    MIN_DATE = dt(1970, 1, 1)
    result.sort(key=lambda c: c.lastMessageTime or MIN_DATE, reverse=True)
    return result


@router.get("/conversation/{other_user_id}", response_model=list[MessageRead])
def get_conversation(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(_get_current_user),
):
    """Return all messages between current user and another user, ordered by date."""
    messages = (
        db.query(Message)
        .filter(
            or_(
                and_(
                    Message.expediteurID == current_user.userID,
                    Message.destinataireID == other_user_id,
                ),
                and_(
                    Message.expediteurID == other_user_id,
                    Message.destinataireID == current_user.userID,
                ),
            )
        )
        .order_by(Message.createdAt.asc())
        .all()
    )

    # Mark unread messages from the other user as read
    for msg in messages:
        if msg.destinataireID == current_user.userID and not msg.lu:
            msg.lu = True
    db.commit()

    return messages


@router.delete("/conversation/{other_user_id}")
def delete_conversation(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(_get_current_user),
):
    """Delete all messages between current user and another user."""
    deleted = (
        db.query(Message)
        .filter(
            or_(
                and_(
                    Message.expediteurID == current_user.userID,
                    Message.destinataireID == other_user_id,
                ),
                and_(
                    Message.expediteurID == other_user_id,
                    Message.destinataireID == current_user.userID,
                ),
            )
        )
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"deleted": deleted}


@router.post("", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
def send_message(
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(_get_current_user),
):
    """Send a message from the current user to another utilisateur."""
    destinataire = db.get(Utilisateur, payload.destinataireID)
    if not destinataire:
        raise HTTPException(status_code=400, detail="Destinataire not found")

    msg = Message(
        expediteurID=current_user.userID,
        destinataireID=payload.destinataireID,
        contenu=payload.contenu,
        type="text",
        lu=False,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.post("/audio", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
async def send_audio_message(
    destinataireID: int = Form(...),
    file: UploadFile = File(...),
    durationSec: int | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(_get_current_user),
):
    """Send an audio message from the current user to another utilisateur."""
    destinataire = db.get(Utilisateur, destinataireID)
    if not destinataire:
        raise HTTPException(status_code=400, detail="Destinataire not found")

    content_type = (file.content_type or "").lower()
    if not content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid file type (audio expected)")

    ext_map = {
        "audio/webm": "webm",
        "audio/ogg": "ogg",
        "audio/mpeg": "mp3",
        "audio/wav": "wav",
        "audio/x-wav": "wav",
    }
    ext = ext_map.get(content_type, "webm")
    filename = f"{uuid4().hex}.{ext}"
    dest_path = UPLOAD_ROOT / filename

    with dest_path.open("wb") as out_f:
        shutil.copyfileobj(file.file, out_f)

    msg = Message(
        expediteurID=current_user.userID,
        destinataireID=destinataireID,
        contenu="🎤 Message vocal",
        type="audio",
        mediaUrl=f"/uploads/messages/{filename}",
        mediaMimeType=content_type or None,
        mediaDurationSec=durationSec,
        lu=False,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.put("/{message_id}/read", response_model=MessageRead)
def mark_as_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(_get_current_user),
):
    """Mark a message as read."""
    msg = db.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.destinataireID != current_user.userID:
        raise HTTPException(status_code=403, detail="Not allowed")
    msg.lu = True
    db.commit()
    db.refresh(msg)
    return msg
