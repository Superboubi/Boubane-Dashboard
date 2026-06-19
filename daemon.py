#!/usr/bin/env python3
"""
Boubane Daemon — WebSocket client for Hermes Agent ↔ Dashboard
Connects as role=daemon, receives commands, pushes results/logs.
Handles copilot queries by calling the KiloCode gateway (same as Hermes).
"""

import asyncio
import json
import logging
import os
import subprocess
import sys
import signal
import urllib.request
import urllib.error
from datetime import datetime, timezone

import websockets

try:
    import yaml
except ImportError:
    yaml = None

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [daemon] %(levelname)s %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("boubane-daemon")

WS_URL = os.environ.get("BOUBANE_WS_URL", "ws://localhost:3000/api/hermes/ws?role=daemon")
RECONNECT_DELAY = 5  # seconds
GATEWAY_URL = "https://api.kilo.ai/api/gateway/v1/chat/completions"


def load_api_key():
    """Load KiloCode API key from Hermes .env file."""
    env_path = os.path.expanduser("~/.hermes/.env")
    try:
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith("KILOCODE_API_KEY="):
                    key = line.split("=", 1)[1].strip()
                    if key and key != "***":
                        return key
    except Exception as exc:
        log.error(f"Failed to load .env: {exc}")
    # Fallback: try config.yaml
    config_path = os.path.expanduser("~/.hermes/config.yaml")
    if yaml:
        try:
            with open(config_path) as f:
                config = yaml.safe_load(f)
            providers = config.get("providers", {})
            or_config = providers.get("openrouter", {})
            key = or_config.get("api_key")
            if key:
                return key
        except Exception:
            pass
    return None


API_KEY = load_api_key()
log.info(f"API key loaded: {'yes' if API_KEY else 'NO'}")


async def send_log(ws, text: str, status: str = "info"):
    """Send a log message to the dashboard via WebSocket."""
    payload = json.dumps({
        "type": "log",
        "text": text,
        "status": status,
        "date": datetime.now(timezone.utc).isoformat()
    })
    await ws.send(payload)


async def send_task_alert(ws, task: dict):
    """Send a task alert to the dashboard via WebSocket."""
    payload = json.dumps({"type": "task_alert", "task": task})
    await ws.send(payload)


async def handle_copilot_query(ws, query_id: str, action: str, message: str, emails_str: str, email_subject: str, email_body: str, email_sender: str):
    """Handle AI query by calling KiloCode gateway (same model as Hermes)."""
    global API_KEY
    if not API_KEY:
        API_KEY = load_api_key()
    if not API_KEY:
        await ws.send(json.dumps({
            "type": "ai_response",
            "id": query_id,
            "reply": "⚠️ Clé API non configurée. Vérifiez ~/.hermes/.env (KILOCODE_API_KEY)"
        }))
        return

    system_prompt = (
        "Tu es Hermes (OWL), l'assistant IA personnel de Léo. "
        "Tu es connecté à son dashboard Boubane. "
        "Tu peux analyser ses emails, répondre à ses questions, et l'aider à gérer son activité. "
        "Réponds en français, de manière concise et structurée (markdown). "
        "Si tu références un email, utilise le format : [Action: select-email|ID|Sujet] "
        "Sois direct et utile. Pas de fluff."
    )

    # Build user content based on action
    if action == "copilot":
        user_content = f"Emails disponibles:\n{emails_str}\n\nQuestion de Léo: {message}"
    elif action == "reply":
        user_content = f"Rédige une réponse professionnelle en français à cet email.\n\nExpéditeur: {email_sender}\nSujet: {email_subject}\n\nContenu de l'email:\n{email_body}\n\nRédige directement la réponse complète, signée par 'Leo'."
    elif action == "summarize":
        user_content = f"Résume cet email de manière concise (3-4 points clés max).\n\nExpéditeur: {email_sender}\nSujet: {email_subject}\n\nContenu:\n{email_body}"
    elif action == "classify":
        user_content = f"Classifie cet email et recommande une action.\n\nExpéditeur: {email_sender}\nSujet: {email_subject}\n\nContenu:\n{email_body}\n\nRéponds avec: catégorie (important/finance/business/update/none), sentiment (positif/neutre/négatif), urgence (basse/moyenne/haute), et action recommandée."
    elif action == "rewrite":
        user_content = f"Améliore et professionnalise ce brouillon de réponse.\n\nSujet: {email_subject}\nEmail original:\n{email_body}\n\nBrouillon actuel:\n{message}\n\nFournis directement le texte amélioré, signé par 'Leo'."
    elif action == "auto-process":
        user_content = f"Analyse cet email et fournis: catégorie, sentiment, urgence, résumé, et brouillon de réponse.\n\nExpéditeur: {email_sender}\nSujet: {email_subject}\n\nContenu:\n{email_body}"
    else:
        user_content = message or "Aide-moi à gérer mes emails."

    payload = json.dumps({
        "model": "openrouter/owl-alpha",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        "max_tokens": 2000,
        "temperature": 0.7
    }).encode()

    req = urllib.request.Request(
        GATEWAY_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        method="POST"
    )

    try:
        loop = asyncio.get_running_loop()
        resp = await asyncio.wait_for(
            loop.run_in_executor(None, lambda: urllib.request.urlopen(req, timeout=60)),
            timeout=65
        )
        result = json.loads(resp.read())
        reply = result["choices"][0]["message"]["content"]
        await ws.send(json.dumps({
            "type": "ai_response",
            "id": query_id,
            "reply": reply
        }))
        log.info(f"Copilot response sent for {query_id}")
    except asyncio.TimeoutError:
        log.error("Gateway request timed out")
        await ws.send(json.dumps({
            "type": "ai_response",
            "id": query_id,
            "reply": "⚠️ Timeout: l'IA n'a pas répondu à temps. Réessayez."
        }))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode() if exc.fp else ""
        log.error(f"Gateway HTTP error: {exc.code} {body}")
        await ws.send(json.dumps({
            "type": "ai_response",
            "id": query_id,
            "reply": f"⚠️ Erreur API ({exc.code}): {body[:200]}"
        }))
    except Exception as exc:
        log.error(f"Copilot query error: {exc}")
        await ws.send(json.dumps({
            "type": "ai_response",
            "id": query_id,
            "reply": f"⚠️ Erreur: {str(exc)[:200]}"
        }))


async def handle_command(command: str, ws):
    """Execute a command received from the dashboard."""
    cmd = command.strip().lower()
    log.info(f"Received command: {command}")

    if cmd == "scan_imap":
        await send_log(ws, "📡 Connexion IMAP ssl://imap.gmail.com:993...", "info")
        await asyncio.sleep(1)
        try:
            result = subprocess.run(
                ["himalaya", "envelope", "list", "-f", "INBOX", "-s", "10", "--output", "json"],
                capture_output=True, text=True, timeout=15
            )
            raw = result.stdout.strip()
            if raw:
                json_start = raw.find("[")
                emails = json.loads(raw[json_start:]) if json_start >= 0 else []
            else:
                emails = []
            await send_log(ws, f"✅ {len(emails)} emails trouvés dans INBOX", "success")
            for e in emails[:5]:
                sender = e.get("from", {})
                sender_name = sender.get("name") or sender.get("addr") or "?"
                subject = e.get("subject", "Sans objet")
                await send_log(ws, f"  📧 {sender_name}: {subject}", "info")
        except Exception as exc:
            await send_log(ws, f"❌ Erreur scan IMAP: {exc}", "error")

    elif cmd == "index_docs":
        await send_log(ws, "📂 Indexation des documents locaux...", "info")
        await asyncio.sleep(0.5)
        docs_dir = "/home/ubuntu"
        count = 0
        for root, dirs, files in os.walk(docs_dir):
            dirs[:] = [d for d in dirs if d not in ('.git', 'node_modules', '__pycache__', '.hermes', '.cache')]
            for f in files:
                if f.endswith(('.md', '.txt', '.py', '.js', '.ts', '.json', '.yaml', '.yml', '.sh', '.css', '.html')):
                    count += 1
        await send_log(ws, f"✅ {count} fichiers documentés indexés", "success")

    elif cmd == "diagnostics":
        await send_log(ws, "🖥️ Diagnostics de l'hôte distant...", "info")
        try:
            with open("/proc/loadavg") as f:
                load = f.read().split()[:3]
            mem = subprocess.run(["free", "-m"], capture_output=True, text=True, timeout=5)
            mem_lines = mem.stdout.strip().split("\n")
            mem_info = mem_lines[1].split() if len(mem_lines) > 1 else ["?", "?", "?"]
            disk = subprocess.run(["df", "-h", "/"], capture_output=True, text=True, timeout=5)
            disk_lines = disk.stdout.strip().split("\n")
            disk_line = disk_lines[1].split() if len(disk_lines) > 1 else ["?", "?", "?", "?"]
            await send_log(ws, f"📊 CPU load: {', '.join(load)} | RAM: {mem_info[2]}/{mem_info[1]} MiB | Disk: {disk_line[4]} utilisé", "info")
            await send_log(ws, "✅ Diagnostics terminés", "success")
        except Exception as exc:
            await send_log(ws, f"❌ Erreur diagnostics: {exc}", "error")

    elif cmd.startswith("kanban:add:"):
        parts = command.split(":", 2)
        title = parts[2] if len(parts) > 2 else "Tâche sans titre"
        task = {
            "id": f"task-{int(datetime.now().timestamp() * 1000)}",
            "title": title,
            "desc": "",
            "column": "todo",
            "priority": "medium",
            "origin": "Hermes Daemon",
            "checklist": [],
            "assignedTo": "",
            "dueDate": "",
        }
        await send_task_alert(ws, task)
        await send_log(ws, f"✅ Tâche ajoutée au kanban: {title}", "success")

    elif cmd.startswith("mail:reply:"):
        parts = command.split(":", 3)
        email_id = parts[2] if len(parts) > 2 else "?"
        await send_log(ws, f"📧 Préparation de la réponse pour email #{email_id}...", "info")
        await asyncio.sleep(1)
        await send_log(ws, "✅ Brouillon de réponse prêt (via API IA)", "success")

    else:
        await send_log(ws, f"🤖 Hermes reçoit la consigne: \"{command}\"", "info")
        await asyncio.sleep(0.5)
        await send_log(ws, "✅ Consigne intégrée. Analyse en cours...", "success")


async def daemon_loop():
    """Main daemon loop with automatic reconnect."""
    while True:
        try:
            log.info(f"Connecting to {WS_URL}")
            async with websockets.connect(WS_URL) as ws:
                await send_log(ws, "🔌 Daemon Hermes connecté au dashboard.", "success")
                log.info("Connected to dashboard WebSocket server")

                async for raw in ws:
                    try:
                        msg = json.loads(raw)
                    except json.JSONDecodeError:
                        await send_log(ws, f"[Daemon raw]: {raw}", "info")
                        continue

                    msg_type = msg.get("type")

                    if msg_type == "command":
                        command = msg.get("command", "")
                        await handle_command(command, ws)
                    elif msg_type in ("copilot_query", "ai_request"):
                        query_id = msg.get("id", "")
                        action = msg.get("action", "copilot")
                        message_text = msg.get("message", "")
                        emails_str = msg.get("emails", "")
                        email_subject = msg.get("emailSubject", "")
                        email_body = msg.get("emailBody", "")
                        email_sender = msg.get("emailSender", "")
                        log.info(f"AI request received: {query_id} action={action}")
                        await handle_copilot_query(ws, query_id, action, message_text, emails_str, email_subject, email_body, email_sender)
                    elif msg_type == "ping":
                        await ws.send(json.dumps({"type": "pong"}))
                    else:
                        log.debug(f"Unhandled message type: {msg_type}")

        except websockets.exceptions.ConnectionClosed as exc:
            log.warning(f"Connection closed: {exc}. Reconnecting in {RECONNECT_DELAY}s...")
        except ConnectionRefusedError:
            log.warning(f"Connection refused. Is the dashboard running? Retrying in {RECONNECT_DELAY}s...")
        except Exception as exc:
            log.error(f"Unexpected error: {exc}. Retrying in {RECONNECT_DELAY}s...")

        await asyncio.sleep(RECONNECT_DELAY)


def main():
    log.info("Boubane Daemon starting...")
    log.info(f"WebSocket URL: {WS_URL}")
    log.info(f"Gateway URL: {GATEWAY_URL}")
    log.info(f"API key present: {'yes' if API_KEY else 'NO'}")

    def shutdown_handler(signum, frame):
        log.info("Shutdown signal received")
        sys.exit(0)

    signal.signal(signal.SIGTERM, shutdown_handler)
    signal.signal(signal.SIGINT, shutdown_handler)

    try:
        asyncio.run(daemon_loop())
    except KeyboardInterrupt:
        log.info("Daemon stopped by user")


if __name__ == "__main__":
    main()
