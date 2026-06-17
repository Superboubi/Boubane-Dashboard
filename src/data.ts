import { AppState } from './types';

export const DEFAULT_STATE: AppState = {
  theme: 'dark',
  user: { name: 'Leo' },
  emails: [
    { id: 'mail-1', sender: 'Lucas Bernard', senderEmail: 'lucas@atome.io', subject: 'Contrat de maintenance VPS', body: 'Bonjour Leo,\n\nVoici le contrat de maintenance modifié pour le serveur VPS. Peux-tu le relire et me dire si tout est OK pour toi ? Il y a quelques clauses sur les heures de support le week-end.\n\nMerci,\nLucas', date: '2026-06-17T09:12:00Z', read: false, starred: true, folder: 'INBOX', category: 'important' },
    { id: 'mail-2', sender: 'Support Boubane', senderEmail: 'support@boubane.io', subject: 'Virement mensuel reçu', body: 'Bonjour,\n\nNous vous confirmons avoir bien reçu votre virement pour le plan Pro de Boubane (votre abonnement mensuel).\n\nCordialement,\nL\'équipe Support', date: '2026-06-16T15:45:00Z', read: true, starred: false, folder: 'INBOX', category: 'finance' },
    { id: 'mail-3', sender: 'Sophie Martin', senderEmail: 'sophie.m@solutions.com', subject: 'Demande de devis - Refactoring site', body: 'Bonjour,\n\nJe souhaiterais obtenir un devis rapide pour la refonte complète de notre landing page d\'entreprise d\'ici fin juillet. Pouvons-nous prévoir un appel de calage vendredi ?\n\nCordialement,\nSophie Martin', date: '2026-06-15T11:20:00Z', read: false, starred: false, folder: 'INBOX', category: 'business' },
    { id: 'mail-4', sender: 'Github Alerts', senderEmail: 'noreply@github.com', subject: '[Security] Alert on dependencies', body: 'One of your dependencies has a known critical vulnerability. Please run "npm audit fix" to resolve the issue as soon as possible on your local workspace.', date: '2026-06-14T08:00:00Z', read: true, starred: false, folder: 'INBOX', category: 'update' }
  ],
  files: [
    { id: 'file-1', name: 'vps_config_rules.txt', size: '12 KB', type: 'txt', date: '2026-06-17T08:30:00Z', content: 'VPS System Rules:\nPort 3000 mapped to Nginx\nDocker instances auto-restart on crash\nWeekly backups scheduled at 3:00 AM UTC' },
    { id: 'file-2', name: 'charte_graphique_atome.pdf', size: '1.4 MB', type: 'pdf', date: '2026-06-16T10:00:00Z', content: 'DOCUMENT PDF : Charte Graphique Atome.\nCouleurs primaires : #1c1815 (Fond sombre), #f0e6d2 (Texte sable), #d4a574 (Accentuated Warm).\nPolices de caractères recommandées : Inter, Space Grotesk.' },
    { id: 'file-3', name: 'repartition_mrr_q2.xlsx', size: '450 KB', type: 'xlsx', date: '2026-06-15T14:15:00Z', content: 'FEUILLE XLSX : Repartition Q2 MRR\nPlan Starter : 12 clients (588€)\nPlan Pro : 8 clients (1200€)\nPlan Enterprise : 2 clients (2400€)\nTotal MRR Mensuel : 4188€\nTaux de Churn cumulé : 3.5%' },
    { id: 'file-4', name: 'dashboard_v3_mockup.png', size: '2.1 MB', type: 'image', date: '2026-06-13T17:40:00Z', content: 'IMAGE VISUELLE : Maquette du tableau de bord haute-fidélité version 3. Layout noir et cuivre.' }
  ],
  calendar: [
    { id: 'cal-1', title: 'Synchro Hebdo Atome', start: '2026-06-18T10:00', end: '2026-06-18T11:00', location: 'Google Meet', desc: 'Point d\'étape hebdomadaire avec l\'équipe Atome sur l\'avancement du VPS.' },
    { id: 'cal-2', title: 'Démo Client — Sophie Martin', start: '2026-06-19T14:00', end: '2026-06-19T14:30', location: 'Zoom', desc: 'Présentation des maquettes pour la refonte du site.' },
    { id: 'cal-3', title: 'Maintenance Infrastructure Backup', start: '2026-06-20T03:00', end: '2026-06-20T04:00', location: 'VPS Production Server', desc: 'Vérification et optimisation périodique des bases de données.' }
  ],
  kanban: [
    { id: 'k-1', title: 'Relire le contrat de Lucas Bernard', desc: 'S\'assurer que les horaires de week-end sont couverts dans le SLA.', column: 'todo', priority: 'high', origin: 'mail-1' },
    { id: 'k-2', title: 'Préparer devis refactoring site', desc: 'Faire une estimation détaillée pour Sophie Martin d\'ici vendredi.', column: 'doing', priority: 'medium', origin: 'mail-3' },
    { id: 'k-3', title: 'Mise à jour dépendances GitHub', desc: 'Résoudre les alertes de sécurité npm via audit.', column: 'done', priority: 'low', origin: 'mail-4' }
  ],
  clients: [
    { id: 'client-1', name: 'Lucas Bernard', email: 'lucas@atome.io', company: 'Atome.io', plan: 'pro', status: 'active', mrr: 150.00, notes: 'Client très actif, utilise le service de supervision de serveurs au quotidien.' },
    { id: 'client-2', name: 'Sophie Martin', email: 'sophie.m@solutions.com', company: 'Solutions SARL', plan: 'starter', status: 'trial', mrr: 49.00, notes: 'En période d\'essai pour la refonte de leur landing page.' },
    { id: 'client-3', name: 'Pierre Durand', email: 'p.durand@innovate.fr', company: 'Innovate SA', plan: 'enterprise', status: 'active', mrr: 1200.00, notes: 'Contrat annuel signé en mai 2026. SLA Premium et assistance sous 4h.' },
    { id: 'client-4', name: 'Carly Vance', email: 'carly@vance.com', company: 'Vance Labs', plan: 'starter', status: 'churned', mrr: 0.00, notes: 'A résilié l\'abonnement en avril pour cause de coupe budgétaire interne.' }
  ],
  webHistory: [
    { id: 'web-1', url: 'https://news.ycombinator.com', date: '2026-06-17T08:15:00Z', type: 'scrape', result: 'Extraits et résumés successifs des titres majeurs. Titres clés : "Local First is the new paradigm", "PostgreSQL 17 detailed performance reports", "Nginx vs Caddy server benchmark". 15 liens secondaires indexés.' },
    { id: 'web-2', url: 'https://v3.tailwindcss.com', date: '2026-06-16T14:20:00Z', type: 'summarize', result: 'Un résumé du site officiel de Tailwind CSS. La documentation explique les principes du CSS orienté utilitaire, la configuration via postcss ou vite, et la gestion du responsive.' }
  ],
  activityLogs: [
    { id: 'act-1', date: '2026-06-17T10:45:00Z', text: 'Hermes a scanné la boîte de réception (INBOX). Aucune nouvelle erreur détectée.', status: 'success' },
    { id: 'act-2', date: '2026-06-17T09:12:00Z', text: 'Réception automatique de l\'email important de Lucas Bernard portant sur le contrat VPS.', status: 'success' },
    { id: 'act-3', date: '2026-06-16T18:00:00Z', text: 'Échec de la connexion réseau avec la plateforme externe de CRM Strapi (Relancé après 2 minutes).', status: 'error' }
  ],
  autoConfig: {
    enabled: true,
    sort: true,
    replyDraft: true,
    pollInterval: 5,
    rules: [
      { id: 'rule-1', trigger: 'Facture / Paiement / Virement / Reçu', action: 'Classer en Finance et archiver automatiquement', active: true },
      { id: 'rule-2', trigger: 'Contrat / Devis / Signature / Validation', action: 'Classer Important & Générer brouillon IA instantané', active: true }
    ],
    logs: [
      { date: '2026-06-17T10:25:00Z', text: 'Traitement automatique : contrat de Lucas Bernard catégorisé en Important !', type: 'info' },
      { date: '2026-06-16T15:46:00Z', text: 'Traitement automatique : email de Support catégorisé en Finance !', type: 'info' }
    ]
  },
  chatMessages: [
    { sender: 'bot', text: 'Bonjour, je suis **Boubane**, votre compagnon IA local. Je supervise votre infrastructure, vos clients, vos e-mails et vos fichiers en temps réel. Comment puis-je vous aider ?', date: '2026-06-17T11:12:00Z' }
  ]
};
