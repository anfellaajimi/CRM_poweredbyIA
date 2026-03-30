from __future__ import annotations

import smtplib
from dataclasses import dataclass
from email.message import EmailMessage

from app.core.config import settings


@dataclass(frozen=True)
class EmailResult:
    ok: bool
    error: str | None = None


def _build_message(to_email: str, subject: str, body: str) -> EmailMessage:
    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)
    return msg


def send_email(to_email: str, subject: str, body: str) -> EmailResult:
    if not settings.SMTP_HOST or not settings.SMTP_FROM:
        return EmailResult(ok=False, error="SMTP is not configured (SMTP_HOST/SMTP_FROM missing)")

    msg = _build_message(to_email=to_email, subject=subject, body=body)

    try:
        if settings.SMTP_SSL:
            server: smtplib.SMTP = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        try:
            server.ehlo()
            if settings.SMTP_TLS and not settings.SMTP_SSL:
                server.starttls()
                server.ehlo()
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD or "")
            server.send_message(msg)
        finally:
            try:
                server.quit()
            except Exception:
                pass
        return EmailResult(ok=True)
    except Exception as exc:
        return EmailResult(ok=False, error=str(exc))

