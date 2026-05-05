from __future__ import annotations

from datetime import datetime
from time import perf_counter
from urllib.error import URLError, HTTPError
from urllib.request import Request, urlopen

from sqlalchemy.orm import Session

from app.models.monitoring import AIMonitoring
from app.models.service import Service


def _normalize_status_from_http(code: int) -> str:
    if 200 <= code < 300:
        return "healthy"
    if 300 <= code < 500:
        return "warning"
    return "critical"


def _check_url(url: str, timeout_s: float = 5.0) -> tuple[str, float | None, str]:
    started = perf_counter()
    req = Request(url=url, method="GET")
    try:
        with urlopen(req, timeout=timeout_s) as resp:
            elapsed_ms = (perf_counter() - started) * 1000.0
            code = int(getattr(resp, "status", 200))
            status = _normalize_status_from_http(code)
            return status, elapsed_ms, f"HTTP {code}"
    except HTTPError as exc:
        elapsed_ms = (perf_counter() - started) * 1000.0
        status = _normalize_status_from_http(int(exc.code))
        return status, elapsed_ms, f"HTTP {exc.code}"
    except URLError as exc:
        return "critical", None, f"URL error: {exc.reason}"
    except Exception as exc:
        return "critical", None, f"Check error: {exc}"


def run_service_monitoring_checks(db: Session, now: datetime | None = None) -> dict:
    now = now or datetime.utcnow()
    services = db.query(Service).all()
    checked = 0
    healthy = 0
    warning = 0
    critical = 0

    for svc in services:
        row = db.query(AIMonitoring).filter(AIMonitoring.serviceID == svc.id).first()
        if row is None:
            row = AIMonitoring(
                serviceID=svc.id,
                status="unknown",
                uptime=0.0,
                responseTime=None,
                lastCheck=now,
                checks=None,
                alerts=None,
            )
            db.add(row)

        if not svc.url:
            row.status = "unknown"
            row.responseTime = None
            row.lastCheck = now
            row.checks = "URL non configurée"
            row.alerts = "Configurer l'URL du service pour activer les checks."
            continue

        status, elapsed_ms, check_msg = _check_url(svc.url)
        row.status = status
        row.responseTime = elapsed_ms
        row.lastCheck = now
        row.checks = check_msg
        row.alerts = None if status == "healthy" else f"Check {status}: {check_msg}"
        row.uptime = 100.0 if status == "healthy" else 0.0

        checked += 1
        if status == "healthy":
            healthy += 1
        elif status == "warning":
            warning += 1
        else:
            critical += 1

    db.commit()
    return {
        "checkedServices": checked,
        "healthy": healthy,
        "warning": warning,
        "critical": critical,
        "totalServices": len(services),
        "checkedAt": now.isoformat(),
    }
