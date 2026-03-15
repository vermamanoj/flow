import { create } from 'zustand';

export type AppState = 
  | 'IDLE' 
  | 'LISTENING' 
  | 'THINKING' 
  | 'SPEAKING' 
  | 'ACTING' 
  | 'PAUSED_FOR_APPROVAL' 
  | 'INTERRUPTED' 
  | 'SAVING_WORKFLOW';

export interface PlanStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'interrupted' | 'approval-needed';
}

export interface LogItem {
  id: string;
  timestamp: string;
  type: 'user' | 'agent' | 'system' | 'action' | 'approval' | 'workflow';
  message: string;
  details?: any;
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  type: 'navigate' | 'screenshot' | 'file_read' | 'file_list' | 'command' | 'url' | 'draft' | 'info';
  title: string;
  data?: any;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  lastRun: string;
  steps: any[];
}

interface AppStore {
  state: AppState;
  setState: (state: AppState) => void;
  
  plan: PlanStep[];
  setPlan: (plan: PlanStep[]) => void;
  updatePlanStep: (id: string, updates: Partial<PlanStep>) => void;
  
  logs: LogItem[];
  addLog: (log: Omit<LogItem, 'id' | 'timestamp'>) => void;
  
  workflows: Workflow[];
  addWorkflow: (workflow: Workflow) => void;
  setWorkflows: (workflows: Workflow[]) => void;

  currentSessionActions: any[];
  addActionToSession: (action: any) => void;
  clearSessionActions: () => void;
  
  // Workspace specific state
  currentView: 'inbox' | 'drafts' | 'notes';
  setCurrentView: (view: 'inbox' | 'drafts' | 'notes') => void;
  drafts: { target: string; content: string }[];
  addDraft: (draft: { target: string; content: string }) => void;
  
  pendingApproval: any | null;
  setPendingApproval: (approval: any | null) => void;

  activities: ActivityItem[];
  addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
  clearActivities: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  state: 'IDLE',
  setState: (state) => set({ state }),
  
  plan: [],
  setPlan: (plan) => set({ plan }),
  updatePlanStep: (id, updates) => set((store) => ({
    plan: store.plan.map(step => step.id === id ? { ...step, ...updates } : step)
  })),
  
  logs: [],
  addLog: (log) => set((store) => ({
    logs: [...store.logs, {
      ...log,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString()
    }]
  })),
  
  workflows: [],
  addWorkflow: (workflow) => set((store) => ({ workflows: [...store.workflows, workflow] })),
  setWorkflows: (workflows) => set({ workflows }),
  
  currentSessionActions: [],
  addActionToSession: (action) => set((store) => ({ currentSessionActions: [...store.currentSessionActions, action] })),
  clearSessionActions: () => set({ currentSessionActions: [] }),
  
  currentView: 'inbox',
  setCurrentView: (view) => set({ currentView: view }),
  drafts: [],
  addDraft: (draft) => set((store) => ({ drafts: [...store.drafts, draft] })),
  
  pendingApproval: null,
  setPendingApproval: (approval) => set({ pendingApproval: approval }),

  activities: [],
  addActivity: (activity) => set((store) => ({
    activities: [...store.activities, {
      ...activity,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString()
    }]
  })),
  clearActivities: () => set({ activities: [] }),
}));
