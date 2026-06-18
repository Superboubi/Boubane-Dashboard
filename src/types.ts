export type EmailAttachment = {
  name: string;
  size: string;
  type: string;
};

export type Email = {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  starred: boolean;
  folder: 'INBOX' | 'SENT' | 'ARCHIVE' | 'TRASH' | 'DRAFT';
  category: 'important' | 'finance' | 'business' | 'update' | 'none';
  sentiment?: string;
  urgency?: 'basse' | 'moyenne' | 'haute';
  aiRecommendation?: string;
  aiDraft?: string;
  aiSummary?: string;
  attachments?: EmailAttachment[];
};

export type AppFile = {
  id: string;
  name: string;
  size: string;
  type: string;
  date: string;
  content: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
  desc: string;
};

export type KanbanTask = {
  id: string;
  title: string;
  desc: string;
  column: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  origin?: string;
  dueDate?: string;
  assignedTo?: string;
  checklist?: { id: string; text: string; done: boolean }[];
};

export type Client = {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'trial' | 'churned';
  mrr: number;
  notes: string;
};

export type ActivityLog = {
  id: string;
  date: string;
  text: string;
  status: 'success' | 'error' | 'info';
};

export type ChatMessage = {
  sender: 'user' | 'bot';
  text: string;
  date: string;
};

export type HermesConfidence = 'high' | 'medium' | 'low';

export type AutoRule = {
  id: string;
  trigger: string;
  action: string;
  active: boolean;
};

export type AutoConfig = {
  enabled: boolean;
  sort: boolean;
  replyDraft: boolean;
  pollInterval: number;
  rules: AutoRule[];
  logs: { date: string; text: string; type: string }[];
};

export type WSMessage =
  | { type: 'status'; daemonConnected: boolean }
  | { type: 'log'; text: string; status: string; date: string }
  | { type: 'task_alert'; task: any }
  | { type: 'metrics_update'; metrics: any }
  | { type: 'hermes_action'; action: string; mailId?: string; details?: string }
  | { type: 'mail_received'; mail: Email };

export type AppState = {
  theme: 'light' | 'dark';
  user: { name: string };
  emails: Email[];
  files: AppFile[];
  calendar: CalendarEvent[];
  kanban: KanbanTask[];
  clients: Client[];
  webHistory: any[];
  activityLogs: ActivityLog[];
  autoConfig: AutoConfig;
  chatMessages: ChatMessage[];
  hermesStatus: 'idle' | 'thinking' | 'ready' | 'error';
  hermesConfidence: HermesConfidence;
  daemonConnected: boolean;
  liveLogs: { text: string; status: string; date: string }[];
};
