import { create } from 'zustand';
import { RevenueItem, ExpenseItem, Theme, UserRole } from './types';
import { db, auth } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email || null,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface MISState {
  revenueItems: RevenueItem[];
  expenseItems: ExpenseItem[];
  collapsedRows: string[];
  theme: Theme;
  activeSheet: 'p&l' | 'balance' | 'ratios';
  selectedCell: { rowId: string; column: string } | null;
  searchFilter: string;
  isSyncing: boolean;
  syncStatus: { type: 'success' | 'error' | 'info'; message: string } | null;
  userRole: UserRole;
  userEmail: string | null;

  // Theme Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Sheet View
  setActiveSheet: (sheet: 'p&l' | 'balance' | 'ratios') => void;

  // Selected Cell
  setSelectedCell: (cell: { rowId: string; column: string } | null) => void;

  // Filter
  setSearchFilter: (filter: string) => void;

  // Collapse Rows
  toggleRowCollapse: (id: string) => void;

  // Revenue Actions
  addRevenueCategory: (name: string, parentId: string | null) => void;
  removeRevenueCategory: (id: string) => void;
  updateRevenueCategoryName: (id: string, name: string) => void;
  updateRevenueValue: (id: string, month: string, value: number) => void;

  // Expense Actions
  addExpenseCategory: (name: string, parentId: string | null) => void;
  removeExpenseCategory: (id: string) => void;
  updateExpenseCategoryName: (id: string, name: string) => void;
  updateExpenseValue: (id: string, month: string, value: number) => void;
  updateExpenseNotes: (id: string, notes: string) => void;
  bulkUploadFinancialData: (data: { name: string; values: Record<string, number> }[]) => void;

  // Data Loading & Persistence
  loadDefaultData: () => void;
  saveToLocal: () => void;
  loadFromLocal: () => void;

  // Firebase Cloud Sync
  pushToCloud: () => Promise<void>;
  pullFromCloud: () => Promise<void>;
  clearSyncStatus: () => void;

  // Monthly Management state & actions
  months: string[];
  addMonth: (month: string) => void;
  removeMonth: (month: string) => void;

  // User Auth & Role Actions
  setUserRole: (role: UserRole) => void;
  setUserEmail: (email: string | null) => void;
}

export const MONTHS = [
  'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26',
  'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26', 'Nov 26', 'Dec 26'
];

const defaultRevenueItems = (): RevenueItem[] => {
  const timestamp = Date.now();
  
  const salesParent: RevenueItem = {
    id: 'rev-sales',
    parentId: null,
    type: 'parent',
    name: 'Sales',
    monthlyValues: {},
    createdAt: timestamp
  };

  const enterpriseSales: RevenueItem = {
    id: 'rev-enterprise-sales',
    parentId: 'rev-sales',
    type: 'child',
    name: 'Enterprise Sales',
    monthlyValues: {
      'Jan 26': 165240.76, 'Feb 26': 186539.20, 'Mar 26': 153853.40,
      'Apr 26': 0, 'May 26': 0, 'Jun 26': 0, 'Jul 26': 0, 'Aug 26': 0, 'Sep 26': 0, 'Oct 26': 0, 'Nov 26': 0, 'Dec 26': 0
    },
    createdAt: timestamp + 1
  };

  const retailSales: RevenueItem = {
    id: 'rev-retail-sales',
    parentId: 'rev-sales',
    type: 'child',
    name: 'retail sales',
    monthlyValues: {
      'Jan 26': 66098.25, 'Feb 26': 64652.22, 'Mar 26': 62821.10,
      'Apr 26': 0, 'May 26': 0, 'Jun 26': 0, 'Jul 26': 0, 'Aug 26': 0, 'Sep 26': 0, 'Oct 26': 0, 'Nov 26': 0, 'Dec 26': 0
    },
    createdAt: timestamp + 2
  };

  return [salesParent, enterpriseSales, retailSales];
};

const defaultExpenseItems = (): ExpenseItem[] => {
  const timestamp = Date.now();

  const createEmptyValues = (val26Jan: number, val26Feb: number, val26Mar: number): Record<string, number> => {
    return {
      'Jan 26': val26Jan, 'Feb 26': val26Feb, 'Mar 26': val26Mar,
      'Apr 26': 0, 'May 26': 0, 'Jun 26': 0, 'Jul 26': 0, 'Aug 26': 0, 'Sep 26': 0, 'Oct 26': 0, 'Nov 26': 0, 'Dec 26': 0
    };
  };

  // Geography Parents
  const usaParent: ExpenseItem = {
    id: 'exp-usa',
    parentId: null,
    type: 'parent',
    name: 'USA Expenses',
    monthlyValues: {},
    notes: '',
    createdAt: timestamp
  };

  const sgParent: ExpenseItem = {
    id: 'exp-singapore',
    parentId: null,
    type: 'parent',
    name: 'Singapore Expenses',
    monthlyValues: {},
    notes: '',
    createdAt: timestamp + 1
  };

  const inParent: ExpenseItem = {
    id: 'exp-india',
    parentId: null,
    type: 'parent',
    name: 'India Expenses',
    monthlyValues: {},
    notes: '',
    createdAt: timestamp + 2
  };

  // USA Children
  const usaChildrenData = [
    { name: 'AWS (USA Expense)', jan: 339.79, feb: 371.72, mar: 332.2 },
    { name: 'ATLASSIAN (USA Expense)', jan: 447.97, feb: 447.97, mar: 497.75 },
    { name: 'BALSAMIQ (USA Expense)', jan: 9, feb: 9, mar: 9 },
    { name: 'Bank Charges (USA Expense)', jan: 195, feb: 0, mar: 0 },
    { name: 'BROWSERSTACK (USA Expense)', jan: 0, feb: 26.93, mar: 0 },
    { name: 'CAPTERRA (USA Expense)', jan: 179, feb: 176, mar: 198 },
    { name: 'CRISP NANTES (USA Expense)', jan: 156.5, feb: 156.5, mar: 156.5 },
    { name: 'DREAMHOST (USA Expense)', jan: 12.95, feb: 12.95, mar: 12.95 },
    { name: 'FIGMA (USA Expense)', jan: 100, feb: 100, mar: 0 },
    { name: 'FRESHWORKS (USA Expense)', jan: 0, feb: 2092.5, mar: 0 },
    { name: 'GITHUB (USA Expense)', jan: 10, feb: 10, mar: 10 },
    { name: 'GOOGLE Cloud (USA Expense)', jan: 5665.71, feb: 6415.59, mar: 5558.86 },
    { name: 'Google FI (USA Expense)', jan: 41.39, feb: 41.49, mar: 41.48 },
    { name: 'Google one (USA Expense)', jan: 19.99, feb: 19.99, mar: 19.99 },
    { name: 'Hubspot Inc (USA Expense)', jan: 50, feb: 50, mar: 50 },
    { name: 'OOMA,INC (USA Expense)', jan: 13.21, feb: 13.21, mar: 13.21 },
    { name: 'OPEN AI (USA Expense)', jan: 420, feb: 420, mar: 572.94 },
    { name: 'Prezi (USA Expense)', jan: 23.6, feb: 23.6, mar: 23.6 },
    { name: 'PUSHWOOSH (USA Expense)', jan: 69.9, feb: 69.9, mar: 69.9 },
    { name: 'Quickbooks (USA Expense)', jan: 75, feb: 75, mar: 75 },
    { name: 'RAYGUN LIMITED WELLINGTON (USA Expense)', jan: 149, feb: 149, mar: 149 },
    { name: 'SENTRY (USA Expense)', jan: 89, feb: 89, mar: 89 },
    { name: 'SIGNALWIRE (USA Expense)', jan: 0, feb: 100, mar: 0 },
    { name: 'SOLARWINDS (USA Expense)', jan: 14.95, feb: 14.95, mar: 14.95 },
    { name: 'UPTIMEROBOT (USA Expense)', jan: 34, feb: 34, mar: 34 },
    { name: 'WHIMSICAL (USA Expense)', jan: 108, feb: 108, mar: 108 },
    { name: 'ZENDESK (USA Expense)', jan: 114.49, feb: 305.18, mar: 0 },
    { name: 'Sada INc (USA Expense)', jan: 15260.03, feb: 16316, mar: 15296 },
    { name: 'Squre inc (USA Expense)', jan: 35, feb: 35, mar: 35 },
    { name: 'BAM*BIDSNTENDERS (USA Expense)', jan: 0, feb: 0, mar: 119.33 },
    { name: 'CLOUDFLARE (USA Expense)', jan: 289, feb: 289, mar: 289 },
    { name: 'HARVARD BUSINESS SERVI (USA Expense)', jan: 1038, feb: 0, mar: 0 },
    { name: 'MAXMIND.COM (USA Expense)', jan: 200, feb: 200, mar: 400 },
    { name: 'PLIVO.COM (USA Expense)', jan: 6695, feb: 7210, mar: 8343 },
    { name: 'SEAO - WEB (MINISTERE (USA Expense)', jan: 0, feb: 0, mar: 22.39 },
    { name: 'Twilio (USA Expense)', jan: 491.4, feb: 0, mar: 0 },
    { name: 'LinkedIn (USA Expense)', jan: 0, feb: 0, mar: 853.1 }
  ];

  const usaChildren: ExpenseItem[] = usaChildrenData.map((item, i) => ({
    id: `exp-usa-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    parentId: 'exp-usa',
    type: 'child',
    name: item.name,
    monthlyValues: createEmptyValues(item.jan, item.feb, item.mar),
    notes: '',
    createdAt: timestamp + 10 + i
  }));

  // Singapore Children
  const sgChildrenData = [
    { name: 'Google Cloud (SG Expense)', jan: 38.48, feb: 29.43, mar: 17.47 },
    { name: 'Apple (SG Expense)', jan: 0, feb: 116.91, mar: 0 },
    { name: 'Go daddy (SG Expense)', jan: 0, feb: 35.87, mar: 0 },
    { name: 'Mailgun (SG Expense)', jan: 900.37, feb: 1017.46, mar: 946.27 },
    { name: 'Bank Charges (SG Expense)', jan: 58.33, feb: 29.48, mar: 29.48 },
    { name: 'SG Tax expenses', jan: 1355.14, feb: 0, mar: 0 },
    { name: 'Director Fees (SG)', jan: 5073.77, feb: 0, mar: 0 },
    { name: 'Apex and manta fees', jan: 4228.14, feb: 0, mar: 1268.44 },
    { name: 'Quickbooks SG', jan: 115, feb: 115, mar: 115 },
    { name: 'D&O Insurance (SG)', jan: 98.58, feb: 98.58, mar: 98.58 }
  ];

  const sgChildren: ExpenseItem[] = sgChildrenData.map((item, i) => ({
    id: `exp-sg-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    parentId: 'exp-singapore',
    type: 'child',
    name: item.name,
    monthlyValues: createEmptyValues(item.jan, item.feb, item.mar),
    notes: '',
    createdAt: timestamp + 200 + i
  }));

  // India Children
  const inChildrenData = [
    { name: 'Salary Expense', jan: 92537.16, feb: 91709.87, mar: 91558.9 },
    { name: 'Depreciation', jan: 17344.28, feb: 17344.28, mar: 17344.28 },
    { name: 'Staff Welfare', jan: 2669.32, feb: 2669.32, mar: 2397.56 },
    { name: 'Subscriptions', jan: 2042.99, feb: 1752.05, mar: 1872.53 },
    { name: 'Stipend Expense', jan: 2334.95, feb: 3260.87, mar: 3198.16 },
    { name: 'Car Lease', jan: 4076.09, feb: 4076.09, mar: 4076.09 },
    { name: 'Wages Expense', jan: 3450.35, feb: 3332, mar: 3623.57 },
    { name: 'Accomodation & Travelling Expense', jan: 0, feb: 0, mar: 0 },
    { name: 'Bank Charges', jan: 14.77, feb: 20.76, mar: 18.67 },
    { name: 'Consultation Fees', jan: 157.61, feb: 157.61, mar: 157.61 },
    { name: 'Electricity Charges', jan: 1826.6, feb: 2114.43, mar: 1757.52 },
    { name: 'freight charges', jan: 0, feb: 0, mar: 0 },
    { name: 'FUEL EXPENSE', jan: 387.88, feb: 231.03, mar: 231.03 },
    { name: 'General Insurance', jan: 11.85, feb: 11.85, mar: 11.85 },
    { name: 'Hardware Civil Work', jan: 90.4, feb: 114.49, mar: 114.49 },
    { name: 'Housekeeping Expenses', jan: 28.18, feb: 38.5, mar: 38.5 },
    { name: 'ICICI Life Insurance Premium', jan: 260.62, feb: 260.62, mar: 260.62 },
    { name: 'Internet Broadband Connection', jan: 1015.4, feb: 1015.4, mar: 1015.4 },
    { name: 'Lease Rent', jan: 102.1, feb: 102.1, mar: 102.1 },
    { name: 'Legal Expense', jan: 97.83, feb: 0, mar: 0 },
    { name: 'OD Interest', jan: 307.87, feb: 319.3, mar: 318.48 },
    { name: 'Office Expense', jan: 240.18, feb: 241.95, mar: 237.49 },
    { name: 'Professional Fees', jan: 543.48, feb: 543.48, mar: 543.48 },
    { name: 'Property Insurance', jan: 34.88, feb: 34.88, mar: 34.88 },
    { name: 'Remittance Charges', jan: 302.99, feb: 0, mar: 594.33 },
    { name: 'Repair & Maintenance', jan: 80.24, feb: 80.03, mar: 79.88 },
    { name: 'Staff Accidental Insurance', jan: 10.85, feb: 10.85, mar: 10.85 },
    { name: 'Staff Health Insurance', jan: 593.29, feb: 593.29, mar: 593.29 },
    { name: 'Term Loan Interest', jan: 4266.53, feb: 4267.87, mar: 4267.04 }
  ];

  const inChildren: ExpenseItem[] = inChildrenData.map((item, i) => ({
    id: `exp-in-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    parentId: 'exp-india',
    type: 'child',
    name: item.name,
    monthlyValues: createEmptyValues(item.jan, item.feb, item.mar),
    notes: '',
    createdAt: timestamp + 300 + i
  }));

  return [usaParent, ...usaChildren, sgParent, ...sgChildren, inParent, ...inChildren];
};

const verifyEditPermission = (actionName: string) => {
  const state = useMISStore.getState();
  if (state.userRole !== 'edit') {
    const errorMsg = `Unauthorized Operation: Role 'view' cannot execute '${actionName}'. Action blocked and logged.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
};

export const useMISStore = create<MISState>((set, get) => ({
  revenueItems: [],
  expenseItems: [],
  collapsedRows: ['exp-usa', 'exp-singapore', 'exp-india'],
  theme: 'light',
  activeSheet: 'p&l',
  selectedCell: null,
  searchFilter: '',
  isSyncing: false,
  syncStatus: null,
  userRole: 'view',
  userEmail: null,
  months: [
    'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26',
    'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26', 'Nov 26', 'Dec 26'
  ],

  setUserRole: (role: UserRole) => set({ userRole: role }),
  setUserEmail: (email: string | null) => set({ userEmail: email }),

  setTheme: (theme: Theme) => {
    set({ theme });
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(nextTheme);
  },

  setActiveSheet: (sheet: 'p&l' | 'balance' | 'ratios') => {
    set({ activeSheet: sheet });
  },

  setSelectedCell: (cell) => {
    set({ selectedCell: cell });
  },

  setSearchFilter: (filter) => {
    set({ searchFilter: filter });
  },

  toggleRowCollapse: (id) => {
    const collapsed = get().collapsedRows;
    if (collapsed.includes(id)) {
      set({ collapsedRows: collapsed.filter(cId => cId !== id) });
    } else {
      set({ collapsedRows: [...collapsed, id] });
    }
  },

  addRevenueCategory: (name, parentId) => {
    verifyEditPermission('addRevenueCategory');
    const text = name.trim();
    if (!text) return;
    const items = get().revenueItems;
    const newId = `rev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // Initialize monthly values with 0
    const monthlyValues: Record<string, number> = {};
    get().months.forEach(m => {
      monthlyValues[m] = 0;
    });

    const newItem: RevenueItem = {
      id: newId,
      parentId,
      type: parentId ? 'child' : 'child', // Simple flat child nodes, can switch or preserve type
      name: text,
      monthlyValues,
      createdAt: Date.now()
    };

    // If adding child, find the parent item and make sure its type is 'parent'
    let updatedItems = [...items];
    if (parentId) {
      updatedItems = items.map(item => {
        if (item.id === parentId) {
          return { ...item, type: 'parent' as const };
        }
        return item;
      });
    }

    set({ revenueItems: [...updatedItems, newItem] });
    get().saveToLocal();
  },

  removeRevenueCategory: (id) => {
    verifyEditPermission('removeRevenueCategory');
    const items = get().revenueItems;
    // Also remove children if this is a parent category
    const remaining = items.filter(item => item.id !== id && item.parentId !== id);
    
    // Check if any parents no longer have children, revert their type if needed, but keeping simple parent-child
    set({ revenueItems: remaining });
    get().saveToLocal();
  },

  updateRevenueCategoryName: (id, name) => {
    verifyEditPermission('updateRevenueCategoryName');
    if (!name.trim()) return;
    const items = get().revenueItems.map(item => {
      if (item.id === id) {
        return { ...item, name: name.trim() };
      }
      return item;
    });
    set({ revenueItems: items });
    get().saveToLocal();
  },

  updateRevenueValue: (id, month, value) => {
    verifyEditPermission('updateRevenueValue');
    const items = get().revenueItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          monthlyValues: {
            ...item.monthlyValues,
            [month]: isNaN(value) ? 0 : value
          }
        };
      }
      return item;
    });
    set({ revenueItems: items });
    get().saveToLocal();
  },

  addExpenseCategory: (name, parentId) => {
    verifyEditPermission('addExpenseCategory');
    const text = name.trim();
    if (!text) return;
    const items = get().expenseItems;
    const newId = `exp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    const monthlyValues: Record<string, number> = {};
    get().months.forEach(m => {
      monthlyValues[m] = 0;
    });

    const newItem: ExpenseItem = {
      id: newId,
      parentId,
      type: parentId ? 'child' : 'child',
      name: text,
      monthlyValues,
      notes: '',
      createdAt: Date.now()
    };

    let updatedItems = [...items];
    if (parentId) {
      updatedItems = items.map(item => {
        if (item.id === parentId) {
          return { ...item, type: 'parent' as const };
        }
        return item;
      });
    }

    set({ expenseItems: [...updatedItems, newItem] });
    get().saveToLocal();
  },

  removeExpenseCategory: (id) => {
    verifyEditPermission('removeExpenseCategory');
    const items = get().expenseItems;
    const remaining = items.filter(item => item.id !== id && item.parentId !== id);
    set({ expenseItems: remaining });
    get().saveToLocal();
  },

  updateExpenseCategoryName: (id, name) => {
    verifyEditPermission('updateExpenseCategoryName');
    if (!name.trim()) return;
    const items = get().expenseItems.map(item => {
      if (item.id === id) {
        return { ...item, name: name.trim() };
      }
      return item;
    });
    set({ expenseItems: items });
    get().saveToLocal();
  },

  updateExpenseValue: (id, month, value) => {
    verifyEditPermission('updateExpenseValue');
    const items = get().expenseItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          monthlyValues: {
            ...item.monthlyValues,
            [month]: isNaN(value) ? 0 : value
          }
        };
      }
      return item;
    });
    set({ expenseItems: items });
    get().saveToLocal();
  },

  updateExpenseNotes: (id, notes) => {
    verifyEditPermission('updateExpenseNotes');
    const items = get().expenseItems.map(item => {
      if (item.id === id) {
        return { ...item, notes };
      }
      return item;
    });
    set({ expenseItems: items });
    get().saveToLocal();
  },

  bulkUploadFinancialData: (data) => {
    verifyEditPermission('bulkUploadFinancialData');
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Normalize and index uploaded names
    const uploadMap = new Map<string, Record<string, number>>();
    data.forEach(d => {
      uploadMap.set(normalize(d.name), d.values);
    });

    // Update Revenue Items
    const updatedRevenue = get().revenueItems.map(item => {
      const matchVals = uploadMap.get(normalize(item.name));
      if (matchVals) {
        // Merge the values
        const newVals = { ...item.monthlyValues };
        Object.entries(matchVals).forEach(([m, val]) => {
          if (newVals[m] !== undefined) {
            newVals[m] = val;
          }
        });
        return { ...item, monthlyValues: newVals };
      }
      return item;
    });

    // Update Expense Items
    const updatedExpense = get().expenseItems.map(item => {
      const matchVals = uploadMap.get(normalize(item.name));
      if (matchVals) {
        // Merge the values
        const newVals = { ...item.monthlyValues };
        Object.entries(matchVals).forEach(([m, val]) => {
          if (newVals[m] !== undefined) {
            newVals[m] = val;
          }
        });
        return { ...item, monthlyValues: newVals };
      }
      return item;
    });

    set({
      revenueItems: updatedRevenue,
      expenseItems: updatedExpense,
      syncStatus: { type: 'success', message: `Bulk upload completed successfully! Processed matching entries.` }
    });
    get().saveToLocal();
  },

  loadDefaultData: () => {
    set({
      revenueItems: defaultRevenueItems(),
      expenseItems: defaultExpenseItems(),
      collapsedRows: ['exp-usa', 'exp-singapore', 'exp-india'],
      months: [
        'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26',
        'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26', 'Nov 26', 'Dec 26'
      ]
    });
    get().saveToLocal();
  },

  saveToLocal: () => {
    try {
      localStorage.setItem('revenueItems_v2', JSON.stringify(get().revenueItems));
      localStorage.setItem('expenseItems_v2', JSON.stringify(get().expenseItems));
      localStorage.setItem('months_v2', JSON.stringify(get().months));
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  },

  loadFromLocal: () => {
    try {
      const revLocal = localStorage.getItem('revenueItems_v2');
      const expLocal = localStorage.getItem('expenseItems_v2');
      const monthsLocal = localStorage.getItem('months_v2');
      const savedTheme = localStorage.getItem('theme') as Theme;

      if (savedTheme) {
        get().setTheme(savedTheme);
      }

      const initialMonths = monthsLocal ? JSON.parse(monthsLocal) : [
        'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26',
        'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26', 'Nov 26', 'Dec 26'
      ];

      if (revLocal && expLocal) {
        const parsedRev = JSON.parse(revLocal);
        const parsedExp = JSON.parse(expLocal);
        
        // Auto-upgrade check: ensure new geo-parent items and the new comprehensive Singapore & India children exist
        const hasUsa = parsedExp.some((item: any) => item.id === 'exp-usa' || item.name === 'USA Expenses');
        const hasSales = parsedRev.some((item: any) => item.id === 'rev-sales' || item.name === 'Sales');
        const hasNewSg = parsedExp.some((item: any) => item.name === 'Google Cloud (SG Expense)');

        if (hasUsa && hasSales && hasNewSg) {
          set({
            revenueItems: parsedRev,
            expenseItems: parsedExp,
            months: initialMonths
          });
        } else {
          get().loadDefaultData();
        }
      } else {
        get().loadDefaultData();
      }
    } catch (e) {
      console.error('Failed to load from local storage', e);
      get().loadDefaultData();
    }
  },

  pushToCloud: async () => {
    verifyEditPermission('pushToCloud');
    const user = auth.currentUser;
    if (!user) {
      set({ syncStatus: { type: 'error', message: 'User must be authenticated to sync.' } });
      return;
    }

    set({ isSyncing: true, syncStatus: { type: 'info', message: 'Publishing draft to cloud...' } });

    const path = 'dashboard_sync/appointy_shared_data_v2';
    try {
      const data = {
        revenueItems: get().revenueItems,
        expenseItems: get().expenseItems,
        months: get().months,
        updatedAt: Date.now(),
        userId: user.uid
      };

      const docRef = doc(db, 'dashboard_sync', 'appointy_shared_data_v2');
      await setDoc(docRef, data);

      set({ syncStatus: { type: 'success', message: 'Draft published to cloud successfully!' } });
    } catch (err: any) {
      console.error('Cloud Sync Write Fail: ', err);
      set({ syncStatus: { type: 'error', message: `Sync failed: ${err.message || String(err)}` } });
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      set({ isSyncing: false });
    }
  },

  pullFromCloud: async () => {
    const user = auth.currentUser;
    if (!user) {
      set({ syncStatus: { type: 'error', message: 'User must be authenticated to sync.' } });
      return;
    }

    set({ isSyncing: true, syncStatus: { type: 'info', message: 'Retrieving cloud draft...' } });

    const path = 'dashboard_sync/appointy_shared_data_v2';
    try {
      const docRef = doc(db, 'dashboard_sync', 'appointy_shared_data_v2');
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        set({ syncStatus: { type: 'error', message: 'No cloud database backup found for this project.' } });
        return;
      }

      const cloudData = docSnap.data();
      if (cloudData && cloudData.revenueItems && cloudData.expenseItems) {
        set({
          revenueItems: cloudData.revenueItems,
          expenseItems: cloudData.expenseItems,
          months: cloudData.months || [
            'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26',
            'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26', 'Nov 26', 'Dec 26'
          ]
        });
        get().saveToLocal();
        set({ syncStatus: { type: 'success', message: 'Latest cloud data loaded successfully!' } });
      } else {
        set({ syncStatus: { type: 'error', message: 'No valid data format found in the cloud backup.' } });
      }
    } catch (err: any) {
      console.error('Cloud Sync Read Fail: ', err);
      set({ syncStatus: { type: 'error', message: `Retrieval failed: ${err.message || String(err)}` } });
      handleFirestoreError(err, OperationType.GET, path);
    } finally {
      set({ isSyncing: false });
    }
  },

  clearSyncStatus: () => {
    set({ syncStatus: null });
  },

  addMonth: (month) => {
    verifyEditPermission('addMonth');
    const text = month.trim();
    if (!text) return;
    const currentMonths = get().months || [];
    if (currentMonths.includes(text)) return;

    const updatedMonths = [...currentMonths, text];

    const parseMonthString = (mStr: string) => {
      const parts = mStr.split(' ');
      if (parts.length !== 2) return new Date(2099, 11);
      const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = mNames.indexOf(parts[0]);
      const year = parseInt(parts[1]);
      if (mIdx === -1 || isNaN(year)) return new Date(2099, 11);
      return new Date(2000 + year, mIdx);
    };

    updatedMonths.sort((a, b) => parseMonthString(a).getTime() - parseMonthString(b).getTime());

    // Initialize the added month inside existing categories
    const revenueItems = get().revenueItems.map(item => {
      if (item.monthlyValues[text] === undefined) {
        return {
          ...item,
          monthlyValues: { ...item.monthlyValues, [text]: 0 }
        };
      }
      return item;
    });

    const expenseItems = get().expenseItems.map(item => {
      if (item.monthlyValues[text] === undefined) {
        return {
          ...item,
          monthlyValues: { ...item.monthlyValues, [text]: 0 }
        };
      }
      return item;
    });

    set({
      months: updatedMonths,
      revenueItems,
      expenseItems
    });
    get().saveToLocal();
  },

  removeMonth: (month) => {
    verifyEditPermission('removeMonth');
    const currentMonths = get().months || [];
    if (currentMonths.length <= 1) return;
    const updatedMonths = currentMonths.filter(m => m !== month);

    const revenueItems = get().revenueItems.map(item => {
      const newValues = { ...item.monthlyValues };
      delete newValues[month];
      return { ...item, monthlyValues: newValues };
    });

    const expenseItems = get().expenseItems.map(item => {
      const newValues = { ...item.monthlyValues };
      delete newValues[month];
      return { ...item, monthlyValues: newValues };
    });

    set({
      months: updatedMonths,
      revenueItems,
      expenseItems
    });
    get().saveToLocal();
  }
}));
