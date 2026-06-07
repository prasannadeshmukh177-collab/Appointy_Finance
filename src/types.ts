export interface RevenueItem {
  id: string;
  parentId: string | null;
  type: 'parent' | 'child';
  name: string;
  monthlyValues: Record<string, number>;
  createdAt: number;
}

export interface ExpenseItem {
  id: string;
  parentId: string | null;
  type: 'parent' | 'child';
  name: string;
  monthlyValues: Record<string, number>;
  notes: string;
  createdAt: number;
}

export type Theme = 'light' | 'dark';
export type UserRole = 'view' | 'edit';
