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
  autoConfig: any;
  chatMessages: ChatMessage[];
};
