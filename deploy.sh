#!/bin/bash
#=======================================================================
# B O U B A N E   D A S H B O A R D
# One-Click Deployment Script
# Works on VPS, local PC, Mac, VM
#=======================================================================

set -e

BACKEND_PORT=3001
DASHBOARD_PORT=3000

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[Boubane]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[Warning]${NC} $1"; }

echo ""
echo "============================================"
echo "  B O U B A N E   D A S H B O A R D"
echo "  Deployment Script"
echo "============================================"
echo ""

# Detect OS and install dependencies
log "Installing dependencies..."

if [ "$(uname)" == "Darwin" ]; then
    # macOS
    if command -v brew &> /dev/null; then
        brew install node nginx 2>/dev/null || true
    fi
else
    # Linux
    sudo apt-get update 2>/dev/null
    sudo apt-get install -y nodejs nginx 2>/dev/null
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash - 2>/dev/null || true
    sudo apt-get install -y nodejs 2>/dev/null
fi

success "Dependencies installed"

# Setup backend
log "Setting up email backend..."
mkdir -p ~/boubane-backend
cd ~/boubane-backend
npm init -y 2>/dev/null || true
npm install express imap dotenv node-fetch 2>&1 | tail -3

# Create server.js
cat > server.js << 'EOFJS'
const express = require('express');
const Imap = require('imap');
require('dotenv').config();
const app = express();
const PORT = process.env.BACKEND_PORT || 3001;
app.use(express.json());
function getImap() { return new Imap({user: process.env.GMAIL_EMAIL, password: process.env.GMAIL_APP_PASSWORD, host: process.env.GMAIL_IMAP_HOST, port: 993, tls: true, tlsOptions: {rejectUnauthorized: false}}); }
app.get('/api/emails', async (req, res) => { try { const imap = getImap(); await new Promise((r, j) => { imap.once('ready', r); imap.once('error', j); imap.connect(); }); const emails = await new Promise((r, j) => { imap.openBox('INBOX', true, (err) => { if (err) {imap.end(); return j(err);} imap.search(['ALL'], (err, results) => { if (err) {imap.end(); return j(err);} if (results.length === 0) {imap.end(); return r([]);} const f = imap.fetch(results.slice(-50), {bodies: 'HEADER.FIELDS (FROM SUBJECT DATE)'}); const list = []; f.on('message', (msg) => { msg.on('body', (stream) => { let data = ''; stream.on('data', c => data += c.toString()); stream.on('end', () => { list.push({id: list.length+1, from: (data.match(/From: (.+)/)||[])[1]||'?', subject: (data.match(/Subject: (.+)/)||[])[1]||'?'}); }); }); f.on('end', () => {imap.end(); r(list);}); f.on('error', e => {imap.end(); j(e);}); }); }); }); res.json({success: true, emails}); } catch (e) { res.status(500).json({error: e.message}); } });
app.get('/health', (req, res) => res.json({status: 'ok'}));
app.listen(PORT, '0.0.0.0', () => { console.log('[Boubane] Backend running on port ' + PORT); });
EOFJS

# Create .env template
if [ ! -f .env ]; then
cat > .env << 'EOFENV'
GMAIL_EMAIL=votre@email.com
GMAIL_APP_PASSWORD=votre_app_password
GMAIL_IMAP_HOST=imap.gmail.com
GMAIL_IMAP_PORT=993
EOFENV
fi

success "Backend configured"

# Start backend
log "Starting backend..."
pkill -f "node server.js" 2>/dev/null || true
nohup node server.js > ~/boubane-backend.log 2>&1 &
sleep 2

if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
    success "Backend running at http://localhost:$BACKEND_PORT"
else
    warn "Backend failed to start. Check ~/boubane-backend.log"
fi

# Setup Dashboard
log "Setting up dashboard..."
cd ~
if [ -d boubane-dashboard ]; then
    cd boubane-dashboard && git pull
else
    git clone https://github.com/Superboubi/Boubane-Dashboard.git boubane-dashboard
    cd boubane-dashboard
fi

npm install 2>&1 | tail -3
npm run build 2>&1 | tail -5

# Start dashboard
log "Starting dashboard..."
nohup npx serve -s dist -l $DASHBOARD_PORT > ~/dashboard.log 2>&1 &
sleep 3

if curl -s http://localhost:$DASHBOARD_PORT > /dev/null 2>&1; then
    success "Dashboard running at http://localhost:$DASHBOARD_PORT"
else
    warn "Dashboard failed to start. Check ~/dashboard.log"
fi

# Setup Nginx (if not on Mac)
if [ "$(uname)" != "Darwin" ]; then
    log "Configuring Nginx..."
    sudo mkdir -p /etc/nginx/certs
    HOST_IP=$(hostname -I | awk '{print $1}')
    sudo openssl req -x509 -nodes -newkey rsa:2048 -keyout /etc/nginx/certs/dashboard.key -out /etc/nginx/certs/dashboard.crt -days 365 -subj "/CN=$HOST_IP" 2>/dev/null
    
    sudo cat > /etc/nginx/sites-available/dashboard << 'EOFNginx'
server {
    listen 443 ssl;
    server_name _;
    ssl_certificate /etc/nginx/certs/dashboard.crt;
    ssl_certificate_key /etc/nginx/certs/dashboard.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    location /api/ { proxy_pass http://127.0.0.1:3001; proxy_http_version 1.1; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_buffering off; }
    location / { proxy_pass http://127.0.0.1:3000; proxy_http_version 1.1; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; }
}
EOFNginx

    sudo rm -f /etc/nginx/sites-enabled/dashboard
    sudo ln -sf /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
    sudo ufw allow 443/tcp 2>/dev/null || true
    sudo nginx -t && sudo systemctl reload nginx
    success "Nginx configured with HTTPS"
fi

echo ""
echo "============================================"
echo -e "${GREEN}  Deployment Complete${NC}"
echo "============================================"
echo ""
echo "Edit ~/boubane-backend/.env with your Gmail credentials"
echo ""
echo "Services:"
echo "  Backend:  http://localhost:$BACKEND_PORT/api/emails"
echo "  Dashboard: http://localhost:$DASHBOARD_PORT"
echo ""