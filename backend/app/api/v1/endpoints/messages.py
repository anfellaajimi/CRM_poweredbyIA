import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile, status
from typing import List, Any
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import get_current_user
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





@router.get("/contacts", response_model=list[ContactRead])
def get_contacts(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """Return contacts (other users) with their last message and unread count."""
    # Determine current user info
    is_client = getattr(current_user, "role", "").lower() == "client"
    current_user_id = getattr(current_user, "id", getattr(current_user, "userID", None))
    current_user_type = "client" if is_client else "staff"

    if is_client:
        # Clients see all active staff (Admin, Manager, Developer)
        others = (
            db.query(Utilisateur)
            .filter(Utilisateur.actif == True)
            .all()
        )
        other_type = "staff"
    else:
        # Staff see other staff (and potentially clients if we want to expand this later)
        # For now, let's keep it consistent: staff see other staff.
        others = (
            db.query(Utilisateur)
            .filter(Utilisateur.userID != current_user_id, Utilisateur.actif == True)
            .all()
        )
        other_type = "staff"

    result: list[ContactRead] = []
    for other in others:
        other_id = other.userID
        
        # Last message between current user and this contact
        last_msg = (
            db.query(Message)
            .filter(
                or_(
                    and_(
                        Message.expediteurID == current_user_id,
                        Message.expediteurType == current_user_type,
                        Message.destinataireID == other_id,
                        Message.destinataireType == other_type,
                    ),
                    and_(
                        Message.expediteurID == other_id,
                        Message.expediteurType == other_type,
                        Message.destinataireID == current_user_id,
                        Message.destinataireType == current_user_type,
                    ),
                )
            )
            .order_by(Message.createdAt.desc())
            .first()
        )

        # Unread count
        unread_count = (
            db.query(Message)
            .filter(
                Message.expediteurID == other_id,
                Message.expediteurType == other_type,
                Message.destinataireID == current_user_id,
                Message.destinataireType == current_user_type,
                Message.lu == False,
            )
            .count()
        )

        result.append(
            ContactRead(
                userID=other_id,
                nom=other.nom,
                role=other.role,
                lastMessage=_last_message_preview(last_msg),
                lastMessageTime=last_msg.createdAt if last_msg else None,
                unreadCount=unread_count,
            )
        )

    # Sort
    from datetime import datetime as dt
    MIN_DATE = dt(1970, 1, 1)
    result.sort(key=lambda c: c.lastMessageTime or MIN_DATE, reverse=True)
    return result


@router.get("/conversation/{other_user_id}", response_model=list[MessageRead])
def get_conversation(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """Return all messages between current user and another user, ordered by date."""
    is_client = getattr(current_user, "role", "").lower() == "client"
    current_user_id = getattr(current_user, "id", getattr(current_user, "userID", None))
    current_user_type = "client" if is_client else "staff"
    other_type = "staff" # Standard assumption for now

    messages = (
        db.query(Message)
        .filter(
            or_(
                and_(
                    Message.expediteurID == current_user_id,
                    Message.expediteurType == current_user_type,
                    Message.destinataireID == other_user_id,
                    Message.destinataireType == other_type,
                ),
                and_(
                    Message.expediteurID == other_user_id,
                    Message.expediteurType == other_type,
                    Message.destinataireID == current_user_id,
                    Message.destinataireType == current_user_type,
                ),
            )
        )
        .order_by(Message.createdAt.asc())
        .all()
    )

    # Mark unread messages from the other user as read
    for msg in messages:
        if (msg.destinataireID == current_user_id and 
            msg.destinataireType == current_user_type and 
            not msg.lu):
            msg.lu = True
    db.commit()

    return messages


@router.delete("/conversation/{other_user_id}")
def delete_conversation(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """Delete all messages between current user and another user."""
    is_client = getattr(current_user, "role", "").lower() == "client"
    current_user_id = getattr(current_user, "id", getattr(current_user, "userID", None))
    current_user_type = "client" if is_client else "staff"
    other_type = "staff"

    deleted = (
        db.query(Message)
        .filter(
            or_(
                and_(
                    Message.expediteurID == current_user_id,
                    Message.expediteurType == current_user_type,
                    Message.destinataireID == other_user_id,
                    Message.destinataireType == other_type,
                ),
                and_(
                    Message.expediteurID == other_user_id,
                    Message.expediteurType == other_type,
                    Message.destinataireID == current_user_id,
                    Message.destinataireType == current_user_type,
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
    current_user: Any = Depends(get_current_user),
):
    """Send a message from the current user to another utilisateur."""
    is_client = getattr(current_user, "role", "").lower() == "client"
    current_user_id = getattr(current_user, "id", getattr(current_user, "userID", None))
    current_user_type = "client" if is_client else "staff"
    
    # Destinataire is always staff for now when a client sends, 
    # but when staff sends, it could be staff or client.
    # For now, let's assume destination is staff.
    destinataire = db.get(Utilisateur, payload.destinataireID)
    if not destinataire:
        raise HTTPException(status_code=400, detail="Destinataire not found")

    msg = Message(
        expediteurID=current_user_id,
        expediteurType=current_user_type,
        destinataireID=payload.destinataireID,
        destinataireType="staff",
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
    current_user: Any = Depends(get_current_user),
):
    """Send an audio message from the current user to another utilisateur."""
    is_client = getattr(current_user, "role", "").lower() == "client"
    current_user_id = getattr(current_user, "id", getattr(current_user, "userID", None))
    current_user_type = "client" if is_client else "staff"

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
        expediteurID=current_user_id,
        expediteurType=current_user_type,
        destinataireID=destinataireID,
        destinataireType="staff",
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
    current_user: Any = Depends(get_current_user),
):
    """Mark a message as read."""
    is_client = getattr(current_user, "role", "").lower() == "client"
    current_user_id = getattr(current_user, "id", getattr(current_user, "userID", None))
    current_user_type = "client" if is_client else "staff"

    msg = db.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if msg.destinataireID != current_user_id or msg.destinataireType != current_user_type:
        raise HTTPException(status_code=403, detail="Not allowed")
    
    msg.lu = True
    db.commit()
    db.refresh(msg)
    return msg
