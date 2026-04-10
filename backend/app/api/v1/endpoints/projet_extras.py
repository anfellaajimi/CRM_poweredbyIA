from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.v1.endpoints._activity import log_activity
from app.db.session import get_db
from app.models.cahier_de_charge import CahierDeCharge
from app.models.projet import Projet
from app.models.projet_file import ProjetFile
from app.models.projet_milestone import ProjetMilestone
from app.models.projet_note import ProjetNote
from app.models.utilisateur import Utilisateur
from app.schemas.cahier_de_charge import CahierDeChargeRead, CahierDeChargeUpdate
from app.schemas.projet_file import ProjetFileRead
from app.schemas.projet_milestone import (
    ProjetMilestoneCreate,
    ProjetMilestoneRead,
    ProjetMilestoneUpdate,
)
from app.schemas.projet_note import ProjetNoteCreate, ProjetNoteRead
from app.schemas.utilisateur import UtilisateurRead

router = APIRouter(prefix="/projets", tags=["Projets"])
UPLOAD_ROOT = Path(__file__).resolve().parents[4] / "uploads" / "projects"


def _get_project_or_404(db: Session, projet_id: int) -> Projet:
    project = db.get(Projet, projet_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projet not found")
    return project


@router.get("/{projet_id}/team", response_model=list[UtilisateurRead])
def get_team(projet_id: int, db: Session = Depends(get_db)):
    projet = _get_project_or_404(db, projet_id)
    return projet.utilisateurs


@router.post("/{projet_id}/team/{user_id}", response_model=list[UtilisateurRead])
def add_team_member(projet_id: int, user_id: int, db: Session = Depends(get_db)):
    projet = _get_project_or_404(db, projet_id)
    user = db.get(Utilisateur, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur not found")
    if user in projet.utilisateurs:
        raise HTTPException(status_code=400, detail="User already assigned")
    projet.utilisateurs.append(user)
    projet.dateMaj = datetime.utcnow()
    log_activity(
        db,
        entity_type="team",
        entity_id=projet.id,
        action="add_member",
        message=f"Added {user.nom} to project {projet.nomProjet}",
    )
    db.commit()
    db.refresh(projet)
    return projet.utilisateurs


@router.delete("/{projet_id}/team/{user_id}", response_model=list[UtilisateurRead])
def remove_team_member(projet_id: int, user_id: int, db: Session = Depends(get_db)):
    projet = _get_project_or_404(db, projet_id)
    user = db.get(Utilisateur, user_id)
    if not user or user not in projet.utilisateurs:
        raise HTTPException(status_code=404, detail="User not assigned")
    projet.utilisateurs.remove(user)
    projet.dateMaj = datetime.utcnow()
    log_activity(
        db,
        entity_type="team",
        entity_id=projet.id,
        action="remove_member",
        message=f"Removed {user.nom} from project {projet.nomProjet}",
    )
    db.commit()
    db.refresh(projet)
    return projet.utilisateurs


@router.get("/{projet_id}/notes", response_model=list[ProjetNoteRead])
def list_notes(projet_id: int, db: Session = Depends(get_db)):
    _get_project_or_404(db, projet_id)
    return (
        db.query(ProjetNote)
        .filter(ProjetNote.projetID == projet_id)
        .order_by(ProjetNote.createdAt.desc())
        .all()
    )


@router.post("/{projet_id}/notes", response_model=ProjetNoteRead, status_code=status.HTTP_201_CREATED)
def create_note(projet_id: int, payload: ProjetNoteCreate, db: Session = Depends(get_db)):
    projet = _get_project_or_404(db, projet_id)
    item = ProjetNote(projetID=projet_id, contenu=payload.contenu, createdBy=payload.createdBy)
    db.add(item)
    projet.dateMaj = datetime.utcnow()
    log_activity(
        db,
        entity_type="note",
        entity_id=projet.id,
        action="create",
        message=f"Added note on project {projet.nomProjet}",
    )
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{projet_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(projet_id: int, note_id: int, db: Session = Depends(get_db)):
    projet = _get_project_or_404(db, projet_id)
    item = db.get(ProjetNote, note_id)
    if not item or item.projetID != projet_id:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(item)
    projet.dateMaj = datetime.utcnow()
    log_activity(
        db,
        entity_type="note",
        entity_id=projet.id,
        action="delete",
        message=f"Deleted note on project {projet.nomProjet}",
    )
    db.commit()
    return None


@router.get("/{projet_id}/files", response_model=list[ProjetFileRead])
def list_files(projet_id: int, db: Session = Depends(get_db)):
    _get_project_or_404(db, projet_id)
    return (
        db.query(ProjetFile)
        .filter(ProjetFile.projetID == projet_id)
        .order_by(ProjetFile.uploadedAt.desc())
        .all()
    )


@router.post("/{projet_id}/files", response_model=ProjetFileRead, status_code=status.HTTP_201_CREATED)
async def upload_file(projet_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    projet = _get_project_or_404(db, projet_id)
    project_dir = UPLOAD_ROOT / str(projet_id)
    project_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}_{file.filename}"
    storage_path = project_dir / filename
    content = await file.read()
    storage_path.write_bytes(content)

    item = ProjetFile(
        projetID=projet_id,
        nom=file.filename or filename,
        mimeType=file.content_type,
        sizeBytes=len(content),
        storagePath=str(storage_path),
    )
    db.add(item)
    projet.dateMaj = datetime.utcnow()
    log_activity(
        db,
        entity_type="file",
        entity_id=projet.id,
        action="upload",
        message=f"Uploaded file on project {projet.nomProjet}",
    )
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{projet_id}/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(projet_id: int, file_id: int, db: Session = Depends(get_db)):
    projet = _get_project_or_404(db, projet_id)
    item = db.get(ProjetFile, file_id)
    if not item or item.projetID != projet_id:
        raise HTTPException(status_code=404, detail="File not found")
    path = Path(item.storagePath)
    if path.exists():
        path.unlink()
    db.delete(item)
    projet.dateMaj = datetime.utcnow()
    log_activity(
        db,
        entity_type="file",
        entity_id=projet.id,
        action="delete",
        message=f"Deleted file from project {projet.nomProjet}",
    )
    db.commit()
    return None


@router.get("/{projet_id}/files/{file_id}/download")
def download_file(projet_id: int, file_id: int, db: Session = Depends(get_db)):
    _get_project_or_404(db, projet_id)
    item = db.get(ProjetFile, file_id)
    if not item or item.projetID != projet_id:
        raise HTTPException(status_code=404, detail="File not found")
    path = Path(item.storagePath)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Stored file not found")
    return FileResponse(path=path, filename=item.nom, media_type=item.mimeType or "application/octet-stream")


@router.get("/{projet_id}/cahier", response_model=CahierDeChargeRead)
def get_project_cahier(projet_id: int, db: Session = Depends(get_db)):
    _get_project_or_404(db, projet_id)
    item = db.query(CahierDeCharge).filter(CahierDeCharge.projetID == projet_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="CahierDeCharge not found")
    return item


@router.put("/{projet_id}/cahier", response_model=CahierDeChargeRead)
def upsert_project_cahier(projet_id: int, payload: CahierDeChargeUpdate, db: Session = Depends(get_db)):
    projet = _get_project_or_404(db, projet_id)
    item = db.query(CahierDeCharge).filter(CahierDeCharge.projetID == projet_id).first()
    data = payload.model_dump(exclude_unset=True)
    data["projetID"] = projet_id
    data.setdefault("objet", projet.nomProjet)
    if item is None:
        item = CahierDeCharge(**data)
        db.add(item)
        action = "create"
    else:
        for key, value in data.items():
            setattr(item, key, value)
        action = "update"
    projet.dateMaj = datetime.utcnow()
    log_activity(
        db,
        entity_type="cahier",
        entity_id=projet.id,
        action=action,
        message=f"Cahier {action}d for project {projet.nomProjet}",
    )
    db.commit()
    db.refresh(item)
    return item


# --- Milestones ---

@router.get("/{projet_id}/milestones", response_model=list[ProjetMilestoneRead])
def list_milestones(projet_id: int, db: Session = Depends(get_db)):
    _get_project_or_404(db, projet_id)
    return (
        db.query(ProjetMilestone)
        .filter(ProjetMilestone.projetID == projet_id)
        .order_by(ProjetMilestone.dueDate.asc().nullslast(), ProjetMilestone.id.desc())
        .all()
    )


@router.post("/{projet_id}/milestones", response_model=ProjetMilestoneRead, status_code=status.HTTP_201_CREATED)
def create_milestone(projet_id: int, payload: ProjetMilestoneCreate, db: Session = Depends(get_db)):
    projet = _get_project_or_404(db, projet_id)
    item = ProjetMilestone(
        projetID=projet_id,
        title=payload.title,
        description=payload.description,
        dueDate=payload.dueDate,
        status="open",
    )
    db.add(item)
    projet.dateMaj = datetime.utcnow()
    log_activity(
        db,
        entity_type="milestone",
        entity_id=projet.id,
        action="create",
        message=f"Milestone créé pour le projet {projet.nomProjet}",
    )
    db.commit()
    db.refresh(item)
    return item


@router.put("/{projet_id}/milestones/{milestone_id}", response_model=ProjetMilestoneRead)
def update_milestone(
    projet_id: int,
    milestone_id: int,
    payload: ProjetMilestoneUpdate,
    db: Session = Depends(get_db),
):
    projet = _get_project_or_404(db, projet_id)
    item = db.get(ProjetMilestone, milestone_id)
    if not item or item.projetID != projet_id:
        raise HTTPException(status_code=404, detail="Milestone not found")

    data = payload.model_dump(exclude_unset=True)
    if "status" in data:
        status_val = (data.get("status") or "").lower()
        if status_val in {"done", "termine", "terminÃ©"}:
            data["status"] = "done"
            data.setdefault("completedAt", datetime.utcnow())
        elif status_val in {"open", "todo", "en_attente"}:
            data["status"] = "open"
            data["completedAt"] = None

    for k, v in data.items():
        setattr(item, k, v)

    projet.dateMaj = datetime.utcnow()
    log_activity(
        db,
        entity_type="milestone",
        entity_id=projet.id,
        action="update",
        message=f"Milestone {item.id} updated for project {projet.nomProjet}",
    )
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{projet_id}/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_milestone(projet_id: int, milestone_id: int, db: Session = Depends(get_db)):
    projet = _get_project_or_404(db, projet_id)
    item = db.get(ProjetMilestone, milestone_id)
    if not item or item.projetID != projet_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
    db.delete(item)
    projet.dateMaj = datetime.utcnow()
    log_activity(
        db,
        entity_type="milestone",
        entity_id=projet.id,
        action="delete",
        message=f"Milestone deleted for project {projet.nomProjet}",
    )
    db.commit()
    return None
