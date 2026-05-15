from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import json

from app.core.config import settings

router = APIRouter(prefix="/ai-generation", tags=["AI Generation"])


class DevisGenerateRequest(BaseModel):
    client_name: str
    prompt: str
    devise: str = "TND"


class CahierGenerateRequest(BaseModel):
    project_name: str
    prompt: str


def _call_groq(system_prompt: str, user_prompt: str) -> str:
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=400, detail="GROQ_API_KEY non configuree")
    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.3,
            },
            timeout=40,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Echec appel Groq: {str(e)}")


def _repair_json_with_groq(raw_content: str, schema_hint: str) -> str:
    repair_system = (
        "You are a JSON repair assistant. "
        "Return only valid JSON. No markdown, no commentary."
    )
    repair_user = (
        "Transforme ce contenu en JSON strict valide selon ce schema attendu.\n"
        f"Schema: {schema_hint}\n\n"
        "Contenu a corriger:\n"
        f"{raw_content}"
    )
    return _call_groq(repair_system, repair_user)


def _parse_json_loose(content: str) -> dict:
    # 1) Strict JSON first.
    try:
        return json.loads(content)
    except Exception:
        pass

    # 2) Remove common markdown fences.
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```json", "").replace("```", "").strip()
        try:
            return json.loads(cleaned)
        except Exception:
            pass

    # 3) Extract first JSON object by brace matching.
    start = content.find("{")
    if start == -1:
        raise ValueError("No JSON object found")
    depth = 0
    end = -1
    for i in range(start, len(content)):
        ch = content[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i
                break
    if end == -1:
        raise ValueError("Unclosed JSON object")
    candidate = content[start : end + 1]
    return json.loads(candidate)


@router.post("/devis")
def generate_devis(payload: DevisGenerateRequest):
    system_prompt = (
        "Tu es assistant commercial. "
        "Retourne strictement un JSON valide sans markdown avec ce schema: "
        '{"title":"string","valid_until_days":number,"tax_rate":number,"fiscal_stamp":number,'
        '"items":[{"description":"string","quantity":number,"unitPrice":number}]}'
    )
    user_prompt = (
        f"Client: {payload.client_name}\n"
        f"Devise: {payload.devise}\n"
        f"Besoin: {payload.prompt}\n"
        "Propose un devis realiste (3 a 6 lignes)."
    )
    content = _call_groq(system_prompt, user_prompt)
    schema_hint = (
        '{"title":"string","valid_until_days":number,"tax_rate":number,"fiscal_stamp":number,'
        '"items":[{"description":"string","quantity":number,"unitPrice":number}]}'
    )
    try:
        return _parse_json_loose(content)
    except Exception:
        try:
            repaired = _repair_json_with_groq(content, schema_hint)
            return _parse_json_loose(repaired)
        except Exception:
            raise HTTPException(status_code=502, detail="Reponse IA invalide (JSON attendu)")


@router.post("/cahier")
def generate_cahier(payload: CahierGenerateRequest):
    system_prompt = (
        "Tu es consultant MOA/MOE. "
        "Retourne strictement un JSON valide sans markdown avec ce schema: "
        '{"objet":"string","description":"html","objectif":"html","perimetre":"html",'
        '"fonctionnalites":"html","contraintes":"html","delais":"string","budgetTexte":"string",'
        '"userStories":"html","reglesMetier":"html","documentsReference":"html","version":"1.0"}'
    )
    user_prompt = (
        f"Projet: {payload.project_name}\n"
        f"Besoin: {payload.prompt}\n"
        "Genere un cahier de charge clair et actionnable en francais."
    )
    content = _call_groq(system_prompt, user_prompt)
    schema_hint = (
        '{"objet":"string","description":"html","objectif":"html","perimetre":"html",'
        '"fonctionnalites":"html","contraintes":"html","delais":"string","budgetTexte":"string",'
        '"userStories":"html","reglesMetier":"html","documentsReference":"html","version":"1.0"}'
    )
    try:
        return _parse_json_loose(content)
    except Exception:
        try:
            repaired = _repair_json_with_groq(content, schema_hint)
            return _parse_json_loose(repaired)
        except Exception:
            raise HTTPException(status_code=502, detail="Reponse IA invalide (JSON attendu)")
