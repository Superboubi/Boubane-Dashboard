import { useState, useEffect } from "react";
import { AppState } from "../types";
import {
  Layout,
  ExternalLink,
  Laptop,
  Tablet,
  Smartphone,
  Save,
  Clock,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Check,
  Sliders,
  Send,
  Plus,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  X,
  Globe,
  Database,
  ArrowUpRight,
  Shield,
  Activity,
  Users,
  Search,
  Eye,
  RefreshCw,
  Sparkles,
  Award,
  Trash2
} from "lucide-react";

interface SiteProps {
  state: AppState;
  updateState?: (updates: Partial<AppState>) => void;
}

// Default values reflecting Boubane's actual brand identity as a Local AI Sysadmin Agent
const DEFAULTS = {
  hero: {
    badge: "🤖 Boubane Agent v2.4 (Hébergé en local) — Actif",
    title: "Le Co-Pilote IA Local de vos VPS & Opérations Business",
    pitch: "Supervisez votre infrastructure système, vos clients, vos tâches critiques et vos flux d'e-mails en local et en toute confidentialité. Boubane s'exécute silencieusement sur votre environnement de travail pour analyser, trier et automatiser à votre place, sans jamais exposer vos données sensibles au cloud.",
    ctaPrimary: "Lancer l'Agent Local",
    ctaSecondary: "Voir la documentation"
  },
  tarifs: {
    period: "monthly" as "monthly" | "yearly",
    plans: [
      {
        id: "starter",
        name: "Indépendant / Sysadmin",
        priceMonthly: "39",
        priceYearly: "29",
        popular: false,
        specs: [
          "1 Serveur VPS supervisé en continu",
          "Tri IA de 1 boîte mail de support",
          "Alertes par webhook local & terminal",
          "Support par e-mail sous 48h"
        ]
      },
      {
        id: "pro",
        name: "Pro / Agence Tech",
        priceMonthly: "119",
        priceYearly: "89",
        popular: true,
        specs: [
          "Jusqu'à 5 serveurs VPS supervisés",
          "Supervision de tunnels de boîtes illimités",
          "Console d'auto-réponse IA intelligente",
          "Scripts d'automatisation cron & backup",
          "Support prioritaire (SLA garanti 2h)"
        ]
      },
      {
        id: "enterprise",
        name: "Souverain / Entreprise",
        priceMonthly: "Sur devis",
        priceYearly: "Sur devis",
        popular: false,
        specs: [
          "Serveurs et VPS connectés illimités",
          "Modèle d'IA local finetuné sur vos données",
          "Double validation humaine & Logs d'audits",
          "Console d'administration multi-utilisateurs",
          "Support dédié 7j/7 avec ingénieur dédié"
        ]
      }
    ]
  },
  resultats: {
    metric1: "99.98%",
    label1: "Taux de disponibilité VPS",
    metric2: "< 3 min",
    label2: "Délai moyen d'auto-réponse",
    metric3: "15+ h",
    label3: "Temps économisé / semaine",
    storyTitle: "Comment Boubane assure la pérennité d'Atome.io",
    storyContent: "Atome.io s'appuyait sur des outils de monitoring clouds lourds et cloisonnés. Grâce à Boubane configuré en tâche de fond local, ils ont unifié la supervision de leurs instances VPS, la catégorisation urgente des réclamations clients et la pré-rédaction robotisée de leurs brouillons techniques, le tout en diminuant leur latence opérationnelle de 75%."
  },
  contact: {
    email: "leo@boubane.io",
    phone: "+33 6 45 89 22 10",
    address: "Atelier Numérique Atome, 75011 Paris, France"
  }
};

// Simulated visitor analytics for the last 14 days
const ANALYTICS_DATA = [
  { day: "04/06", visitors: 145, pageviews: 290, leads: 1 },
  { day: "05/06", visitors: 160, pageviews: 310, leads: 0 },
  { day: "06/06", visitors: 210, pageviews: 450, leads: 2 },
  { day: "07/06", visitors: 195, pageviews: 380, leads: 1 },
  { day: "08/06", visitors: 280, pageviews: 590, leads: 3 },
  { day: "09/06", visitors: 320, pageviews: 680, leads: 4 },
  { day: "10/06", visitors: 290, pageviews: 610, leads: 2 },
  { day: "11/06", visitors: 340, pageviews: 720, leads: 3 },
  { day: "12/06", visitors: 410, pageviews: 890, leads: 5 },
  { day: "13/06", visitors: 390, pageviews: 810, leads: 2 },
  { day: "14/06", visitors: 450, pageviews: 950, leads: 4 },
  { day: "15/06", visitors: 480, pageviews: 1020, leads: 6 },
  { day: "16/06", visitors: 520, pageviews: 1140, leads: 5 },
  { day: "17/06", visitors: 580, pageviews: 1290, leads: 8 }
];

export function Site({ state, updateState }: SiteProps) {
  // Navigation Tabs for Website Manager Hub
  const [activeSubTab, setActiveSubTab] = useState<"analytics" | "preview" | "editor">("analytics");
  
  // UI Device Preview Mode
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  
  // Simulated Interactive Leads captured on the website
  const [leads, setLeads] = useState<any[]>(() => {
    const saved = localStorage.getItem("boubane_marketing_leads");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: "lead-1", name: "Sophie Martin", email: "sophie.m@solutions.com", text: "Bonjour, j'aimerais avoir des détails sur l'intégration locale de Boubane sur nos serveurs VPS Debian.", date: "2026-06-15T11:20:00Z", status: "En cours", source: "Formulaire de contact" },
      { id: "lead-2", name: "Lucas Bernard", email: "lucas@atome.io", text: "Super concept l'agent local ! Comment configurer le webhook avec notre serveur VPS ?", date: "2026-06-17T09:12:00Z", status: "Nouveau", source: "Bouton CTA" },
      { id: "lead-3", name: "Thomas Morel", email: "t.morel@cloudnet.fr", text: "Je suis intéressé par la formule Souverain pour notre agence de 10 personnes.", date: "2026-06-16T18:00:00Z", status: "Traité", source: "Formulaire de contact" }
    ];
  });

  // Website copy config setup (instantly changes the mock preview)
  const [siteConfig, setSiteConfig] = useState<any>(() => {
    const saved = localStorage.getItem("boubane_site_config");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULTS;
  });

  // Simulator for contact form inside preview
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persistence triggers
  useEffect(() => {
    localStorage.setItem("boubane_site_config", JSON.stringify(siteConfig));
  }, [siteConfig]);

  useEffect(() => {
    localStorage.setItem("boubane_marketing_leads", JSON.stringify(leads));
  }, [leads]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Callback to handle contact form send in the live preview
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formMessage) return;

    // Create new lead in marketing state
    const newLead = {
      id: "lead-" + Date.now(),
      name: formName,
      email: formEmail,
      text: formMessage,
      date: new Date().toISOString(),
      status: "Nouveau",
      source: "Formulaire de contact"
    };

    const updatedLeads = [newLead, ...leads];
    setLeads(updatedLeads);

    // Side Effect: Inject into AppState emails list so it is also processed by Boubane AI Agent!
    if (updateState) {
      const newEmailVal = {
        id: "mail-lead-" + Date.now(),
        sender: formName,
        senderEmail: formEmail,
        subject: "Nouveau Lead Landing Page — " + formName,
        body: `Bonjour Leo,\n\nUn visiteur vient de soumettre un formulaire de contact sur votre site web :\n\n• Nom : ${formName}\n• Email : ${formEmail}\n\nMessage :\n"${formMessage}"\n\n---\nCe lead a été automatiquement capturé et trié par Boubane.`,
        date: new Date().toISOString(),
        read: false,
        starred: true,
        folder: "INBOX" as const,
        category: "business" as const,
        urgency: "moyenne" as const,
        aiRecommendation: "Prérédiger un e-mail chaleureux présentant le plan Sysadmin 39€",
        aiDraft: `Bonjour ${formName},\n\nMerci pour votre intérêt pour Boubane ! J'ai bien reçu votre message. Notre outil s'intègre en local très facilement.\n\nPouvons-nous planifier un créneau rapide cette semaine pour en discuter ?\n\nBien cordialement,\nLeo Saillour`
      };

      const revisedEmails = [newEmailVal, ...state.emails];
      
      // Add Activity Log
      const newActivity = {
        id: "act-lead-" + Date.now(),
        date: new Date().toISOString(),
        text: `Formulaire de contact soumis par ${formName}. Lead stocké et transmis à la boîte de réception.`,
        status: "success" as const
      };
      const revisedLogs = [newActivity, ...state.activityLogs];

      updateState({
        emails: revisedEmails,
        activityLogs: revisedLogs
      });
    }

    setFormName("");
    setFormEmail("");
    setFormMessage("");
    setFormSubmitted(true);
    triggerToast("✨ Formulaire de contact soumis ! Nouveau lead généré en boîte de réception.");

    setTimeout(() => setFormSubmitted(false), 5000);
  };

  const deleteLead = (id: string) => {
    setLeads(leads.filter(l => l.id !== id));
    triggerToast("Lead supprimé avec succès.");
  };

  const updateLeadStatus = (id: string, newStatus: string) => {
    setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
    triggerToast(`Statut du lead mis à jour : ${newStatus}`);
  };

  const resetToDEFAULTS = () => {
    if (confirm("Voulez-vous restaurer les textes du site par défaut ?")) {
      setSiteConfig(DEFAULTS);
      triggerToast("Les textes par défaut ont été restaurés.");
    }
  };

  // Analytical metrics calculations
  const totalPageViews = ANALYTICS_DATA.reduce((sum, item) => sum + item.pageviews, 0);
  const totalUniqueVisitors = ANALYTICS_DATA.reduce((sum, item) => sum + item.visitors, 0);
  const totalLeadsCount = leads.length;
  const avgConversionRate = ((totalLeadsCount / totalUniqueVisitors) * 100).toFixed(2);

  // SVG Area Chart points generator
  const chartHeight = 160;
  const chartWidth = 500;
  const maxVisitors = Math.max(...ANALYTICS_DATA.map(d => d.visitors));
  const points = ANALYTICS_DATA.map((d, index) => {
    const x = (index / (ANALYTICS_DATA.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - (d.visitors / maxVisitors) * (chartHeight - 40) - 20;
    return { x, y, ...d };
  });

  const pathD = points.length > 0 ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ") : "";
  const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - 20} L ${points[0].x} ${chartHeight - 20} Z` : "";

  return (
    <div id="site-hub" className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div id="site-toast" className="fixed bottom-6 right-6 z-50 bg-[#c084fc] text-[#121014] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-purple-300 font-medium text-xs animate-bounce">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#d48c45]/10 text-[#d48c45] shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-[var(--text)] leading-none">Console Vitrine & Web</h1>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#d48c45] bg-[#d48c45]/10 px-1.5 py-0.5 rounded">Live</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              Gérez votre landing page, le trafic et automatisez vos leads.
            </p>
          </div>
        </div>

        {/* Live URL indicator */}
        <div className="flex items-center gap-3 bg-[var(--bg-surface)] border border-[var(--border)] p-2 px-3 rounded-lg text-xs shrink-0 shadow-sm">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="flex items-center gap-3 divide-x divide-[var(--border)]">
            <div className="font-semibold text-[var(--text)] flex items-center gap-1.5">
              boubane.io
              <a href="https://boubane.vercel.app/" target="_blank" rel="noreferrer" className="text-[var(--text-muted)] hover:text-[#d48c45] transition-colors inline-flex">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] pl-3 font-mono hidden sm:block">Build (Vercel Prod) : -2h</div>
          </div>
        </div>
      </div>

      {/* Dashboard Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-px shrink-0">
        <div id="subtab-selector" className="flex gap-2">
          {[
            { id: "analytics", label: "Tableau de Bord & Leads", icon: TrendingUp },
            { id: "preview", label: "Aperçu Direct", icon: Eye },
            { id: "editor", label: "Éditeur de Pages", icon: Sliders }
          ].map(tb => (
            <button
              key={tb.id}
              onClick={() => setActiveSubTab(tb.id as any)}
              className={`flex items-center gap-2 py-3 px-4 font-medium text-xs border-b-2 rounded-t-lg transition-all focus:outline-none cursor-pointer ${
                activeSubTab === tb.id
                  ? "border-[#d48c45] text-[#d48c45] bg-[#d48c45]/5"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              <tb.icon className="w-4 h-4 shrink-0" />
              <span>{tb.label}</span>
              {tb.id === "analytics" && leads.some(l => l.status === "Nouveau") && (
                <span className="w-2 h-2 rounded-full bg-[#d48c45] animate-ping" />
              )}
            </button>
          ))}
        </div>

        {/* Global Action */}
        <div className="flex items-center gap-2">
          {activeSubTab === "editor" && (
            <button
              onClick={resetToDEFAULTS}
              className="text-xs px-3 py-1.5 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg transition-colors focus:outline-none cursor-pointer"
            >
              Réinitialiser
            </button>
          )}
          <span className="text-[10px] text-[var(--text-muted)] font-mono hidden sm:inline">
            SSL Chiffré • Hébergement Edge-Network
          </span>
        </div>
      </div>

      {/* SUB-VIEW 1: TABLEAU DE BORD MARKETING & ANALYTICS */}
      {activeSubTab === "analytics" && (
        <div id="tab-analytics" className="space-y-6">
          {/* Key Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Visiteurs uniques (14j)", value: totalUniqueVisitors, change: "+34.2%", positive: true, note: "Audience globale" },
              { label: "Pages vues (14j)", value: totalPageViews, change: "+48.9%", positive: true, note: "Fidélité : 2.22 / visite" },
              { label: "Formulaires Capturés", value: totalLeadsCount, change: `+${leads.filter(l => l.status === 'Nouveau').length} nv`, positive: true, note: "Transmis en Inbox" },
              { label: "Taux de Conversion", value: `${avgConversionRate}%`, change: "+1.2%", positive: true, note: "Moyenne sectorielle : 1.8%" }
            ].map((m, idx) => (
              <div key={idx} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{m.label}</span>
                  <span className="text-[10px] font-bold text-emerald-500 font-mono">{m.change}</span>
                </div>
                <div className="text-2xl font-black text-[var(--text)] font-mono">{m.value}</div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">{m.note}</div>
                {/* Visual accent lines */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d48c45]/20 to-transparent" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interactive Custom SVG Traffic Graph */}
            <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-[var(--text)] text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#d48c45]" /> Courbe d'Audience Commerciale
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Visites quotidiennes uniques sur le site officiel (boubane.io)</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono text-[var(--text-muted)]">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-[#d48c45] rounded" /> Visiteurs</span>
                </div>
              </div>

              {/* Pure SVG Graph Implementation - Perfect responsive custom design */}
              <div className="relative flex-1 h-44 w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d48c45" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#d48c45" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                    const y = 20 + r * (chartHeight - 40);
                    return (
                      <line key={i} x1="20" y1={y} x2={chartWidth - 20} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3" />
                    );
                  })}

                  {/* Area beneath curve */}
                  {areaD && <path d={areaD} fill="url(#areaGrad)" />}

                  {/* Line curve */}
                  {pathD && <path d={pathD} fill="none" stroke="#d48c45" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

                  {/* Nodes & tooltip targets */}
                  {points.map((p, index) => (
                    <g key={index} onMouseEnter={() => setHoverIndex(index)} onMouseLeave={() => setHoverIndex(null)}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={hoverIndex === index ? 5 : 3.5}
                        fill={hoverIndex === index ? "#ffffff" : "var(--bg-surface)"}
                        stroke={hoverIndex === index ? "#d48c45" : "#d48c45"}
                        strokeWidth={hoverIndex === index ? 3 : 2}
                        className="transition-all cursor-pointer"
                      />
                      {/* Hidden interactive target block */}
                      <circle cx={p.x} cy={p.y} r="15" fill="transparent" className="cursor-pointer" />
                    </g>
                  ))}
                </svg>

                {/* SVG Live Tooltip */}
                {hoverIndex !== null && points[hoverIndex] && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-[var(--bg-surface)] border border-[#d48c45] p-2 rounded shadow-2xl text-[10px] flex items-center gap-3 animate-in fade-in duration-100 z-10">
                    <span className="font-semibold text-[var(--accent)] font-mono">{points[hoverIndex].day}</span>
                    <span className="text-[var(--text-muted)]">|</span>
                    <span>Visiteurs : <strong className="text-[var(--text)] font-mono font-bold">{points[hoverIndex].visitors}</strong></span>
                    <span className="text-[var(--text-muted)]">|</span>
                    <span>Pages : <strong className="text-[var(--text)] font-mono font-bold">{points[hoverIndex].pageviews}</strong></span>
                  </div>
                )}
                
                {hoverIndex === null && (
                  <div className="absolute bottom-2 right-2 text-[9px] text-[var(--text-muted)] italic font-mono bg-[var(--bg-surface)]/80 px-1.5 rounded">
                    Survolez les points pour afficher le détail
                  </div>
                )}
              </div>

              {/* Custom horizontal labels */}
              <div className="flex justify-between px-4 mt-2 text-[10px] font-mono text-[var(--text-muted)] shrink-0">
                <span>04 Juin</span>
                <span>07 Juin</span>
                <span>10 Juin</span>
                <span>14 Juin</span>
                <span>17 Juin (Aujourd'hui)</span>
              </div>
            </div>

            {/* Core Web Vitals Auditor */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-[var(--text)] text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> Audit SEO & Vitesse Google
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Indices de qualité de la landing page par phare Google Lighthouse.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 my-auto shrink-0">
                {[
                  { value: 100, label: "Performance", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { value: 98, label: "SEO / Robot index", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { value: 96, label: "Accessibilité", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { value: 100, label: "Best-Practices", color: "text-emerald-400", bg: "bg-emerald-500/10" }
                ].map((aud, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-[var(--bg)] ${aud.bg} ${aud.color} font-mono shrink-0`}>
                      {aud.value}%
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--text)] truncate">{aud.label}</div>
                      <div className="text-[9px] text-emerald-500 font-medium">Optimal (Excellent)</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--border)] pt-4 text-center shrink-0">
                <button
                  onClick={() => triggerToast("🔄 Re-génération de l'audit Lighthouse en cours...")}
                  className="w-full py-1.5 bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--text-muted)] text-[var(--text)] rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 focus:outline-none cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Relancer l'audit de page
                </button>
              </div>
            </div>
          </div>

          {/* Captured Leads Table */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
              <div>
                <h3 className="font-semibold text-sm text-[var(--text)] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#d48c45]" /> Leads & Prospect Capturés en Ligne
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Clients potentiels ayant interagi avec l'aperçu du site ou le formulaire.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs shrink-0 font-mono text-[var(--text-muted)]">
                Projet : <span className="text-[#d48c45] font-semibold">Boubane Live Integrator</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--bg)] text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider border-b border-[var(--border)]">
                    <th className="p-4 pl-6">Prospect</th>
                    <th className="p-4">Message / Requête envoyée</th>
                    <th className="p-4">Date de capture</th>
                    <th className="p-4 text-center">Source de Lead</th>
                    <th className="p-4 text-center">Statut Actuel</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs text-[var(--text)] font-medium">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-12 text-[var(--text-muted)]">
                        <AlertCircle className="w-8 h-8 mx-auto opacity-20 mb-2" />
                        <p className="text-sm font-semibold">Aucun lead actif collecté.</p>
                        <p className="text-xs mt-1">Soumettez le formulaire de contact dans l'onglet "Aperçu Direct" pour en créer un.</p>
                      </td>
                    </tr>
                  ) : (
                    leads.map(ld => (
                      <tr key={ld.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="p-4 pl-6">
                          <div className="font-semibold text-slate-100">{ld.name}</div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{ld.email}</div>
                        </td>
                        <td className="p-4 max-w-sm">
                          <div className="text-slate-200 truncate" title={ld.text}>{ld.text}</div>
                        </td>
                        <td className="p-4 text-[10px] text-[var(--text-muted)] font-mono">
                          {new Date(ld.date).toLocaleString("fr-FR")}
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--text-muted)]">
                            {ld.source}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <select
                            value={ld.status}
                            onChange={(e) => updateLeadStatus(ld.id, e.target.value)}
                            className={`text-[9px] font-bold uppercase tracking-wider rounded-md py-1 px-2.5 focus:outline-none focus:ring-1 border bg-[var(--bg)] cursor-pointer ${
                              ld.status === "Nouveau"
                                ? "text-purple-400 border-purple-500/20"
                                : ld.status === "En cours"
                                ? "text-[#d48c45] border-amber-500/20"
                                : "text-emerald-400 border-emerald-500/20"
                            }`}
                          >
                            <option value="Nouveau">🔴 Nouveau</option>
                            <option value="En cours">🟡 En cours</option>
                            <option value="Traité">🟢 Traité</option>
                          </select>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => triggerToast(`📨 Notification envoyée pour répondre à ${ld.name}.`)}
                              className="px-2 py-1 bg-[#d48c45]/15 text-[#d48c45] border border-amber-500/20 hover:bg-[#d48c45]/25 rounded text-[10px] font-bold transition-all focus:outline-none cursor-pointer"
                              title="Répondre"
                            >
                              Répondre IA
                            </button>
                            <button
                              onClick={() => deleteLead(ld.id)}
                              className="p-1 text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--bg)] rounded transition-all focus:outline-none cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: APERÇU DIRECT ET INTERACTIF DE LA VITRINE */}
      {activeSubTab === "preview" && (
        <div id="tab-preview" className="space-y-4">
          {/* Responsive device switches */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-3 rounded-xl flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-1">
              {[
                { id: "desktop", label: "Ordinateur (100%)", icon: Laptop },
                { id: "tablet", label: "Tablette (768px)", icon: Tablet },
                { id: "mobile", label: "Mobile (375px)", icon: Smartphone }
              ].map(dev => (
                <button
                  key={dev.id}
                  onClick={() => setPreviewDevice(dev.id as any)}
                  className={`flex items-center gap-1.5 py-1.5 px-3 text-[10px] font-bold rounded-lg border transition-all focus:outline-none cursor-pointer ${
                    previewDevice === dev.id
                      ? "bg-[var(--text)] text-[var(--bg)] border-transparent"
                      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  <dev.icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{dev.label}</span>
                </button>
              ))}
            </div>

            <div className="text-[10px] text-[var(--text-muted)] font-mono">
              Visualisation en temps réel du site : <span className="text-slate-300 font-semibold">https://boubane.io</span>
            </div>
          </div>

          {/* Interactive Frame Box */}
          <div className="flex justify-center transition-all duration-300">
            <div
              className={`border border-[var(--border)] rounded-2xl overflow-hidden bg-[#0d0a0f] text-slate-100 shadow-2xl transition-all duration-300 flex flex-col ${
                previewDevice === "desktop"
                  ? "w-full max-w-5xl h-[650px]"
                  : previewDevice === "tablet"
                  ? "w-[768px] h-[650px]"
                  : "w-[375px] h-[600px] text-xs"
              }`}
            >
              {/* Fake web browser URL bar control */}
              <div className="bg-[#141017] border-b border-[var(--border)] p-3 px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/60 block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60 block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/60 block" />
                </div>
                <div className="flex-1 max-w-sm mx-auto bg-[#0d0a0f] border border-[var(--border)] px-4 py-1 rounded-full text-[10px] font-mono text-center flex items-center justify-center gap-1.5 text-slate-400">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>https://boubane.io/</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                    PROD
                  </span>
                </div>
              </div>

              {/* Dynamic Inner Preview Container */}
              <div id="preview-frame" className="flex-1 overflow-y-auto font-sans text-slate-200">
                
                {/* Visual Site Header Bar */}
                <header className="border-b border-purple-950/40 bg-[#0d0a0f]/80 backdrop-blur sticky top-0 z-20 flex items-center justify-between p-4 px-6 md:px-8">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-amber-500 text-black flex items-center justify-center font-black text-sm">
                      B
                    </div>
                    <span className="font-bold text-sm tracking-tight text-white">boubane<span className="text-amber-500">.</span></span>
                  </div>
                  <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
                    <span className="hover:text-white cursor-pointer transition-colors">Caractéristiques</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Solutions</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Tarifs</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Avis client</span>
                  </nav>
                  <div>
                    <button className="bg-white hover:bg-slate-200 text-black text-xs font-bold py-1.5 px-3.5 rounded transition-all focus:outline-none">
                      Console
                    </button>
                  </div>
                </header>

                {/* VISUAL ELEMENT 1: HERO CONTAINER SECTION */}
                <section className="relative overflow-hidden pt-12 pb-16 px-6 md:px-12 text-center border-b border-purple-950/20 bg-radial-gradient from-purple-950/10 via-transparent to-transparent">
                  {/* Glowing core background shapes */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />

                  {/* Highlighting Label Badge */}
                  {siteConfig.hero.badge && (
                    <div className="inline-flex items-center gap-1.5 bg-[#4c1d95]/30 text-[#d48c45] border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-semibold mb-6 animate-pulse">
                      <Sparkles className="w-3 h-3 text-[#d48c45]" />
                      <span>{siteConfig.hero.badge}</span>
                    </div>
                  )}

                  <h1 className="text-xl md:text-3xl font-black tracking-tight text-white max-w-2xl mx-auto leading-tight">
                    {siteConfig.hero.title}
                  </h1>

                  <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto mt-4 leading-relaxed font-medium">
                    {siteConfig.hero.pitch}
                  </p>

                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <button className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-[#d48c45] text-black font-extrabold text-xs rounded hover:opacity-90 active:scale-95 transition-all focus:outline-none shadow-lg">
                      {siteConfig.hero.ctaPrimary}
                    </button>
                    <button className="px-5 py-2.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded transition-all focus:outline-none">
                      {siteConfig.hero.ctaSecondary}
                    </button>
                  </div>

                  {/* Core Visual Mockup Frame of Boubane Desktop Panel inside Landingpage */}
                  <div className="mt-12 max-w-4xl mx-auto rounded-xl border border-purple-950/40 bg-[#120f18]/80 shadow-2xl p-4 text-left font-mono text-[10px] leading-relaxed relative">
                    <div className="flex items-center gap-1.5 mb-3 border-b border-purple-950/20 pb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
                      <span className="text-slate-400 font-bold">boubane-local-daemon --active</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
                      <div>
                        <div className="text-amber-500 font-semibold">[SUPERVISION VPS] Active Ports Map</div>
                        <div className="text-gray-400 mt-1">&gt; Checking port 3000 mapping... OK (Nginx routing traffic)</div>
                        <div className="text-gray-400">&gt; Backup engine daemon online... Sync completed with server (100%)</div>
                        <div className="text-emerald-400">&gt; Logs audit: CPU load 12%, RSS memory 145MB. All systems safe.</div>
                      </div>
                      <div>
                        <div className="text-amber-500 font-semibold">[EMAIL PRIORITIZER] Processing Inbox</div>
                        <div className="text-gray-400 mt-1">&gt; 1 unread ticket found from "Lucas" (lucas@atome.io)</div>
                        <div className="text-gray-400">&gt; Classifying emotional criteria... Urgent (95% guarantee)</div>
                        <div className="text-emerald-400">&gt; Auto-reply pre-compiled ready in draft box. Human check enabled!</div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* VISUAL ELEMENT 2: PERFORMANCE METRICS SECTION */}
                <section className="py-12 bg-[#09070a] border-b border-purple-950/25 px-6">
                  <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                    <div className="p-4 rounded-xl bg-[#120e17]/40 border border-purple-950/20">
                      <div className="text-2xl font-black text-amber-500 font-mono">{siteConfig.resultats.metric1}</div>
                      <div className="text-[10px] text-slate-400 mt-1 font-bold">{siteConfig.resultats.label1}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#120e17]/40 border border-purple-950/20">
                      <div className="text-2xl font-black text-slate-100 font-mono">{siteConfig.resultats.metric2}</div>
                      <div className="text-[10px] text-slate-400 mt-1 font-bold">{siteConfig.resultats.label2}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#120e17]/40 border border-purple-950/20">
                      <div className="text-2xl font-black text-slate-100 font-mono">{siteConfig.resultats.metric3}</div>
                      <div className="text-[10px] text-slate-400 mt-1 font-bold">{siteConfig.resultats.label3}</div>
                    </div>
                  </div>
                </section>

                {/* VISUAL ELEMENT 3: TESTIMONIAL / CASE STUDY SECTION */}
                <section className="py-12 px-6 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      <h4 className="text-xs md:text-sm font-bold uppercase tracking-widest text-[#d48c45]">Étude de Cas Réelle</h4>
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-white">{siteConfig.resultats.storyTitle}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">{siteConfig.resultats.storyContent}</p>
                  </div>
                  <div className="p-6 rounded-xl bg-[#120f18] border border-purple-950/30 flex flex-col justify-between">
                    <p className="italic text-xs text-slate-300 leading-relaxed">
                      "Boubane a complètement changé ma routine de freelance. Mon serveur est surveillé 24h/24, et mes clients importants reçoivent des réponses techniques hyper-qualitées sans que je n'aie à gaspiller ma concentration."
                    </p>
                    <div className="mt-4 flex items-center gap-3 border-t border-purple-950/20 pt-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-amber-500">
                        LB
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-white">Lucas Bernard</div>
                        <div className="text-[9px] text-slate-400 font-mono">Fondateur, Atome.io</div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* VISUAL ELEMENT 4: PRICING SECTION */}
                <section className="py-12 bg-[#09070a] px-6">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="text-center font-medium">
                      <h3 className="text-lg md:text-xl font-black text-white">Déployez l'Agent Boubane Aujourd'hui</h3>
                      <p className="text-xs text-slate-400 mt-2">Tarification transparente, sans engagement, 100% exécuté localement.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {siteConfig.tarifs.plans.map((pl: any) => (
                        <div
                          key={pl.id}
                          className={`rounded-2xl p-5 flex flex-col justify-between relative transition-all ${
                            pl.popular
                              ? "bg-[#140e1b] border-2 border-amber-500/40 shadow-xl"
                              : "bg-[#100c14]/80 border border-purple-950/40"
                          }`}
                        >
                          {pl.popular && (
                            <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-500 text-black text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                              Recommandé / Pro
                            </span>
                          )}

                          <div className="space-y-4">
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{pl.name}</div>
                              <div className="mt-1 flex items-baseline gap-1.5">
                                <span className="text-2xl font-black text-white font-mono">
                                  {siteConfig.tarifs.period === "monthly" ? pl.priceMonthly : pl.priceYearly}
                                </span>
                                {pl.priceMonthly !== "Sur devis" && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    € / {siteConfig.tarifs.period === "monthly" ? "mois" : "an"}
                                  </span>
                                )}
                              </div>
                            </div>

                            <ul className="space-y-2 text-[10px] text-slate-300 font-normal">
                              {pl.specs.map((sp: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span>{sp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="mt-6 pt-4 border-t border-purple-950/20">
                            <button
                              className={`w-full py-1.5 rounded text-[10px] font-bold tracking-wide uppercase transition-all focus:outline-none ${
                                pl.popular
                                  ? "bg-amber-500 hover:bg-amber-400 text-black"
                                  : "bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white"
                              }`}
                            >
                              Activer l'abonnement
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* VISUAL ELEMENT 5: CONTACT FORM SECTION IN THE PREVIEW */}
                <section className="py-12 bg-[#0c090d]/60 border-t border-purple-950/20 px-6">
                  <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Information addresses */}
                    <div className="space-y-5">
                      <h3 className="text-lg font-bold text-white">Nous Contacter</h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        Une demande technique ? Notre co-pilote local triera et réagira en moins de 3 minutes pour nous notifier en direct.
                      </p>

                      <div className="space-y-3 text-xs text-slate-300 font-normal">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-amber-500" />
                          <span>{siteConfig.contact.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-amber-500" />
                          <span>{siteConfig.contact.phone}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-amber-500" />
                          <span>{siteConfig.contact.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Form Simulator */}
                    <div className="bg-[#120f18] border border-purple-950/30 p-5 rounded-2xl">
                      <div className="text-xs font-bold text-white mb-4 flex items-center justify-between">
                        <span>Formulaire de Contact Vitrine</span>
                        <span className="text-[10px] text-amber-500 font-mono">Test d'Intégration Live</span>
                      </div>

                      {formSubmitted ? (
                        <div className="p-8 text-center bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 animate-in zoom-in-95 duration-200">
                          <CheckCircle className="w-8 h-8 text-amber-500 mx-auto" />
                          <div className="text-slate-100 font-bold text-xs">Message envoyé avec succès !</div>
                          <div className="text-[10px] text-slate-400">
                            Un nouvel e-mail a été simulé dans votre tableau de bord Boubane.
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleContactSubmit} className="space-y-3.5">
                          <div>
                            <label className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider mb-1">Votre Nom</label>
                            <input
                              type="text"
                              value={formName}
                              onChange={(e) => setFormName(e.target.value)}
                              required
                              placeholder="Jean Dupuy"
                              className="w-full bg-[#0d0a0f] border border-purple-950/50 rounded p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider mb-1">Votre E-mail</label>
                            <input
                              type="email"
                              value={formEmail}
                              onChange={(e) => setFormEmail(e.target.value)}
                              required
                              placeholder="jean@entreprise.fr"
                              className="w-full bg-[#0d0a0f] border border-purple-950/50 rounded p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-400 block font-semibold uppercase tracking-wider mb-1">Message technique ou question</label>
                            <textarea
                              value={formMessage}
                              onChange={(e) => setFormMessage(e.target.value)}
                              required
                              rows={3}
                              placeholder="Pouvez-vous nous aider à configurer le daemon en tâche de fond ?"
                              className="w-full bg-[#0d0a0f] border border-purple-950/50 rounded p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
                          >
                            <Send className="w-3.5 h-3.5" /> Soumettre sur le site actif
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </section>

                {/* VISUAL SITE FOOTER */}
                <footer className="bg-[#09070a] border-t border-purple-950/30 p-8 text-center text-slate-500 text-[10px]">
                  <div>© 2026 Boubane Software Co. Tous droits réservés.</div>
                  <div className="mt-2 text-slate-600">
                    Propulsé par l'Agent IA Souverain Local • Atome VPS Partner.
                  </div>
                </footer>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: ÉDITEUR DE CONTENU PUREMENT VISUEL (PAS DE CODE FAKE !) */}
      {activeSubTab === "editor" && (
        <div id="tab-editor" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main settings options */}
          <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 space-y-6">
            <h3 className="font-semibold text-[var(--text)] text-sm flex items-center gap-2 border-b border-[var(--border)] pb-3 shrink-0">
              <Sliders className="w-4 h-4 text-[#d48c45]" /> Modifier les Textes Rédacteurs (Copright Vitrine)
            </h3>

            {/* Part 1: Hero Block settings */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest bg-[#d48c45]/10 px-2.5 py-1.5 rounded inline-block shrink-0">
                1. Partie d'En-tête (Hero Section)
              </h4>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Badge de notification</label>
                  <input
                    type="text"
                    value={siteConfig.hero.badge}
                    onChange={(e) => setSiteConfig({ ...siteConfig, hero: { ...siteConfig.hero, badge: e.target.value } })}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-[#d48c45]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Titre principal d'accroche</label>
                  <input
                    type="text"
                    value={siteConfig.hero.title}
                    onChange={(e) => setSiteConfig({ ...siteConfig, hero: { ...siteConfig.hero, title: e.target.value } })}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text)] font-semibold focus:outline-none focus:border-[#d48c45]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Texte de pitch descriptif</label>
                  <textarea
                    value={siteConfig.hero.pitch}
                    onChange={(e) => setSiteConfig({ ...siteConfig, hero: { ...siteConfig.hero, pitch: e.target.value } })}
                    rows={4}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-[#d48c45]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Bouton CTA Primaire</label>
                    <input
                      type="text"
                      value={siteConfig.hero.ctaPrimary}
                      onChange={(e) => setSiteConfig({ ...siteConfig, hero: { ...siteConfig.hero, ctaPrimary: e.target.value } })}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-[#d48c45]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Bouton CTA Secondaire</label>
                    <input
                      type="text"
                      value={siteConfig.hero.ctaSecondary}
                      onChange={(e) => setSiteConfig({ ...siteConfig, hero: { ...siteConfig.hero, ctaSecondary: e.target.value } })}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-[#d48c45]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Part 2: Pricing configuration switcher */}
            <div className="space-y-4 border-t border-[var(--border)] pt-5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest bg-[#d48c45]/10 px-2.5 py-1.5 rounded inline-block shrink-0">
                  2. Ajuster l'Affichage des Tarifs
                </h4>
                <div className="flex items-center gap-1 bg-[var(--bg)] border border-[var(--border)] p-1 rounded-lg shrink-0">
                  <button
                    onClick={() => setSiteConfig({ ...siteConfig, tarifs: { ...siteConfig.tarifs, period: "monthly" } })}
                    className={`px-3 py-1 rounded text-[10px] font-bold transition-all focus:outline-none cursor-pointer ${
                      siteConfig.tarifs.period === "monthly" ? "bg-[var(--text)] text-[var(--bg)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    Mensuel
                  </button>
                  <button
                    onClick={() => setSiteConfig({ ...siteConfig, tarifs: { ...siteConfig.tarifs, period: "yearly" } })}
                    className={`px-3 py-1 rounded text-[10px] font-bold transition-all focus:outline-none cursor-pointer ${
                      siteConfig.tarifs.period === "yearly" ? "bg-[var(--text)] text-[var(--bg)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    Annuel
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {siteConfig.tarifs.plans.map((pl: any, idx: number) => (
                  <div key={pl.id} className="bg-[var(--bg)] border border-[var(--border)] p-4 rounded-xl space-y-3">
                    <div className="text-[11px] font-extrabold text-[#d48c45] uppercase tracking-wide">{pl.name}</div>
                    <div>
                      <label className="text-[9px] text-[var(--text-muted)] block font-semibold mb-0.5">Prix Mensuel (€)</label>
                      <input
                        type="text"
                        value={pl.priceMonthly}
                        onChange={(e) => {
                          const updated = [...siteConfig.tarifs.plans];
                          updated[idx] = { ...pl, priceMonthly: e.target.value };
                          setSiteConfig({ ...siteConfig, tarifs: { ...siteConfig.tarifs, plans: updated } });
                        }}
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2.5 py-1 text-xs text-[var(--text)] font-semibold font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-[var(--text-muted)] block font-semibold mb-0.5">Prix Annuel (€)</label>
                      <input
                        type="text"
                        value={pl.priceYearly}
                        onChange={(e) => {
                          const updated = [...siteConfig.tarifs.plans];
                          updated[idx] = { ...pl, priceYearly: e.target.value };
                          setSiteConfig({ ...siteConfig, tarifs: { ...siteConfig.tarifs, plans: updated } });
                        }}
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2.5 py-1 text-xs text-[var(--text)] font-semibold font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Part 3: Metrics section */}
            <div className="space-y-4 border-t border-[var(--border)] pt-5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest bg-[#d48c45]/10 px-2.5 py-1.5 rounded inline-block shrink-0">
                3. Chiffres & Indicateurs Promus
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { metricKey: "metric1", labelKey: "label1", label: "Indicateur 1" },
                  { metricKey: "metric2", labelKey: "label2", label: "Indicateur 2" },
                  { metricKey: "metric3", labelKey: "label3", label: "Indicateur 3" }
                ].map((ind, i) => (
                  <div key={i} className="bg-[var(--bg)] border border-[var(--border)] p-4 rounded-xl space-y-2">
                    <div className="text-[10px] font-bold text-slate-300">{ind.label}</div>
                    <input
                      type="text"
                      value={siteConfig.resultats[ind.metricKey]}
                      onChange={(e) => setSiteConfig({
                        ...siteConfig,
                        resultats: { ...siteConfig.resultats, [ind.metricKey]: e.target.value }
                      })}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2.5 py-1 text-xs text-amber-500 font-bold font-mono"
                      placeholder="99%"
                    />
                    <input
                      type="text"
                      value={siteConfig.resultats[ind.labelKey]}
                      onChange={(e) => setSiteConfig({
                        ...siteConfig,
                        resultats: { ...siteConfig.resultats, [ind.labelKey]: e.target.value }
                      })}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2.5 py-1 text-[10px] text-[var(--text-muted)]"
                      placeholder="Label d'indicateur"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Part 4: Legal & Contact */}
            <div className="space-y-4 border-t border-[var(--border)] pt-5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest bg-[#d48c45]/10 px-2.5 py-1.5 rounded inline-block shrink-0">
                4. Cordonnées d'Affiliation Corporate
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">E-mail Officiel</label>
                  <input
                    type="email"
                    value={siteConfig.contact.email}
                    onChange={(e) => setSiteConfig({ ...siteConfig, contact: { ...siteConfig.contact, email: e.target.value } })}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text)] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Téléphone de Support</label>
                  <input
                    type="text"
                    value={siteConfig.contact.phone}
                    onChange={(e) => setSiteConfig({ ...siteConfig, contact: { ...siteConfig.contact, phone: e.target.value } })}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text)] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Adresse Géographique</label>
                  <input
                    type="text"
                    value={siteConfig.contact.address}
                    onChange={(e) => setSiteConfig({ ...siteConfig, contact: { ...siteConfig.contact, address: e.target.value } })}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text)]"
                  />
                </div>
              </div>
            </div>

            {/* Global trigger */}
            <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4 shrink-0">
              <button
                onClick={() => {
                  triggerToast("💾 Modifications enregistrées avec succès et déployées en production !");
                  setActiveSubTab("preview");
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-[#d48c45] text-black font-extrabold text-xs rounded-lg transition-all shadow-lg flex items-center gap-2 focus:outline-none cursor-pointer"
              >
                <Save className="w-4 h-4" /> Enregistrer & Publier en live
              </button>
            </div>
          </div>

          {/* Quick guide and review helper card */}
          <div className="space-y-6">
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-1.5 shrink-0">
                <Sparkles className="w-4 h-4 text-amber-400" /> Co-pilote d'Auto-Déploiement
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Les modifications publiées sur la console configurent instantanément la base de données.
              </p>

              <div className="bg-[var(--bg)] border border-[var(--border)] p-4 rounded-xl space-y-3 font-mono text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">CI/CD Statut :</span>
                  <span className="text-emerald-400 font-bold">BRANCH MAIN (Green)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Build Trigger :</span>
                  <span className="text-slate-100 font-bold">Auto-Deploy Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">DNS Zones :</span>
                  <span className="text-slate-100 font-bold">boubane.io → Live</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Speed Booster :</span>
                  <span className="text-[#d48c45] font-bold">Vercel Edge CDN</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 border-t border-[var(--border)] pt-3 flex items-start gap-2 leading-relaxed">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Consultez l'onglet <strong>"Aperçu Direct"</strong> pour interagir avec le formulaire et tester l'affichage en différentes résolutions.</span>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="font-bold text-xs text-amber-500 uppercase tracking-wider">Aperçu Rédactionnel Rapide</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Voici à quoi ressemble votre accroche actuelle :
              </p>
              <div className="p-3 bg-[var(--bg)] rounded border-l-2 border-amber-500 italic text-[11px] text-slate-300">
                "{siteConfig.hero.title}"
              </div>
              <div className="text-[10px] text-slate-400">
                Idéal d'accroche : Moins de 75 caractères, centré sur le bénéfice client.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
