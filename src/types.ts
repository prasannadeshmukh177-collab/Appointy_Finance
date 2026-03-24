export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  due_date: string | null;
  completed: boolean;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  assignee: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  status: 'pending' | 'completed' | 'in-progress';
  subtasks: Subtask[];
  created_at: string;
  recurrence_id?: string;
  recurrence_frequency?: 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  recurrence_end_date?: string;
  reminder_advance_value?: number;
  reminder_advance_unit?: 'minutes' | 'hours' | 'days';
  reminder_message?: string;
}
