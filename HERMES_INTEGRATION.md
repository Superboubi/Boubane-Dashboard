# Integration Hermes Agent

Ce guide explique comment connecter un agent Hermes au Dashboard Boubane.

## Architecture

```
┌─────────────┐     REST/WebSocket      ┌──────────────────┐
│   Hermes    │ ◄─────────────────────► │  Boubane         │
│   Agent     │   GET /api/hermes/*      │  Dashboard       │
│             │   POST /api/hermes/*    │  (Express)       │
│             │   WS /api/hermes/ws     │                  │
└─────────────┘                         └────────┬─────────┘
                                                 │
                                                 ▼
                                        ┌──────────────────┐
                                        │  Himalaya IMAP   │
                                        │  (emails reel)   │
                                        └──────────────────┘
```

## Endpoints API

### 1. Lire les emails

```bash
GET /api/hermes/emails?folder=INBOX&limit=50

# Reponse
{
  "success": true,
  "emails": [
    {
      "id": "mail-123",
      "sender": "Sophie Martin",
      "senderEmail": "sophie@example.com",
      "subject": "Devis refonte site",
      "body": "",
      "date": "2026-06-20T10:00:00Z",
      "read": false,
      "folder": "inbox"
    }
  ]
}
```

### 2. Lire un email complet

```bash
GET /api/hermes/emails/mail-123

# Reponse
{
  "success": true,
  "email": {
    "id": "mail-123",
    "sender": "Sophie Martin",
    "senderEmail": "sophie@example.com",
    "subject": "Devis refonte site",
    "body": "Bonjour Leo,\n\nVoici le devis pour...",
    "date": "2026-06-20T10:00:00Z",
    "read": false,
    "folder": "inbox"
  }
}
```

### 3. Envoyer une analyse

```bash
POST /api/hermes/analysis
Content-Type: application/json

{
  "emailId": "mail-123",
  "category": "business",
  "sentiment": "positif",
  "urgency": "moyenne",
  "summary": "Demande de devis pour refonte de site web. Client interesse, besoin de reponse rapide.",
  "recommendedAction": "Preparer un devis detaille et relancer vendredi.",
  "draftReply": "Bonjour Sophie,\n\nMerci pour votre interet...\n\nCordialement,\nLeo",
  "confidence": 92
}

# Reponse
{
  "success": true,
  "analysis": { ... }
}
```

### 4. Statut de connexion

```bash
GET /api/hermes/status

# Reponse
{
  "connected": true,
  "daemonCount": 1,
  "timestamp": "2026-06-20T10:00:00Z"
}
```

## Connexion WebSocket (optionnel)

Pour recevoir les evenements en temps reel :

```javascript
const ws = new WebSocket('wss://votre-dashboard.com/api/hermes/ws?role=daemon');

ws.onopen = () => {
  console.log('Hermes connecte au dashboard');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'email_event') {
    // Un email a ete ouvert sur le dashboard
    console.log('Email ouvert:', data.emailId);
    // -> Hermes peut declencher une analyse automatique
  }
  
  if (data.type === 'ai_request') {
    // Le dashboard demande une analyse IA
    console.log('Analyse demandee pour:', data.emailSubject);
    // -> Hermes envoie le resultat via POST /api/hermes/analysis
  }
};
```

## Integration Python (exemple)

```python
import requests
import json
from datetime import datetime

DASHBOARD_URL = "https://app.boubane.ai"
HERMES_AGENT_ID = "hermes-1"

def get_emails(folder="INBOX", limit=50):
    """Recupere la liste des emails depuis le dashboard"""
    response = requests.get(
        f"{DASHBOARD_URL}/api/hermes/emails",
        params={"folder": folder, "limit": limit}
    )
    return response.json().get("emails", [])

def get_email_body(email_id):
    """Recupere le corps d'un email"""
    response = requests.get(f"{DASHBOARD_URL}/api/hermes/emails/{email_id}")
    return response.json().get("email", {})

def send_analysis(email_id, category, sentiment, urgency, summary, confidence=85):
    """Envoie une analyse au dashboard"""
    analysis = {
        "emailId": email_id,
        "category": category,
        "sentiment": sentiment,
        "urgency": urgency,
        "summary": summary,
        "confidence": confidence,
        "analyzedBy": HERMES_AGENT_ID,
        "analyzedAt": datetime.utcnow().isoformat()
    }
    response = requests.post(
        f"{DASHBOARD_URL}/api/hermes/analysis",
        json=analysis
    )
    return response.json()

# Exemple d'utilisation
def process_emails():
    emails = get_emails()
    for email in emails:
        if not email.get("read"):
            # Analyser les emails non lus
            print(f"Analyse de: {email['subject']}")
            
            # Envoyer l'analyse au dashboard
            send_analysis(
                email_id=email["id"],
                category="business",
                sentiment="positif",
                urgency="moyenne",
                summary="Email important a traiter"
            )

if __name__ == "__main__":
    process_emails()
```

## Variables d'environnement

```bash
# .env
HERMES_DASHBOARD_URL="https://app.boubane.ai"
HERMES_AGENT_ID="hermes-1"
HERMES_API_KEY=""  # Optionnel
```

## Checklist d'integration

- [ ] Hermes peut appeler `GET /api/hermes/emails`
- [ ] Hermes peut appeler `GET /api/hermes/emails/:id`
- [ ] Hermes peut envoyer `POST /api/hermes/analysis`
- [ ] Les analyses apparaissent dans le dashboard en temps reel (WebSocket)
- [ ] Dashboard notifie Hermes quand un email est ouvert (WS `email_event`)

## Debug

Verifier le statut de connexion :

```bash
curl https://app.boubane.ai/api/hermes/status
```

Logs a surveiller :
- `[Hermes] Analysis received for mail-XXX` quand Hermes envoie une analyse
- `🔌 Hermes Daemon connection closed` si connection perdue
