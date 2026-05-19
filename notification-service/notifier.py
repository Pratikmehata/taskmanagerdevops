# notification-service/notifier.py
"""
Lightweight Flask micro-service that sends transactional emails
via SMTP whenever the backend emits a task event.
"""

import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from flask import Flask, request, jsonify

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

SMTP_HOST = os.environ["SMTP_HOST"]
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER = os.environ["SMTP_USER"]
SMTP_PASS = os.environ["SMTP_PASS"]
FROM_EMAIL = os.environ.get("FROM_EMAIL", SMTP_USER)


# ── Email templates ──────────────────────────────────────────────────────────

TEMPLATES = {
    "completed": {
        "subject": "✅ Task completed: {title}",
        "html": """\
<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px">
  <h2 style="color:#16a34a">Task Completed 🎉</h2>
  <p>Great work! You just marked the following task as <strong>done</strong>:</p>
  <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;border-radius:6px;margin:20px 0">
    <strong style="font-size:18px">{title}</strong>
  </div>
  <p style="color:#6b7280;font-size:13px">Keep up the momentum — TaskManager</p>
</div>""",
    },
    "due_soon": {
        "subject": "⏰ Task due soon: {title}",
        "html": """\
<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px">
  <h2 style="color:#d97706">Reminder: Task Due Soon</h2>
  <p>Your task is due <strong>tomorrow</strong>:</p>
  <div style="background:#fffbeb;border-left:4px solid #d97706;padding:16px;border-radius:6px;margin:20px 0">
    <strong style="font-size:18px">{title}</strong>
  </div>
  <p style="color:#6b7280;font-size:13px">Stay on track — TaskManager</p>
</div>""",
    },
}


def send_email(to: str, subject: str, html: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = FROM_EMAIL
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(FROM_EMAIL, to, msg.as_string())


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/notify")
def notify():
    """
    Expected JSON body:
      { "to": "user@example.com", "taskTitle": "...", "event": "completed" | "due_soon" }
    """
    data = request.get_json(silent=True) or {}
    to = data.get("to")
    title = data.get("taskTitle", "Untitled task")
    event = data.get("event", "completed")

    if not to:
        return jsonify({"error": "Missing 'to' field"}), 400

    template = TEMPLATES.get(event)
    if not template:
        return jsonify({"error": f"Unknown event '{event}'"}), 400

    subject = template["subject"].format(title=title)
    html = template["html"].format(title=title)

    try:
        send_email(to, subject, html)
        log.info("📧  Email sent to %s [event=%s]", to, event)
        return jsonify({"sent": True})
    except Exception as exc:
        log.error("Email failed: %s", exc)
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
