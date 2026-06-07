import React, { useMemo, useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Plus,
  RefreshCw,
  Sun,
  Moon,
  FileSpreadsheet,
  LayoutDashboard,
  Settings,
  Download,
  CloudUpload,
  CloudDownload,
  X,
  LogOut,
  User,
  Eye,
  Activity,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useMISStore } from './store';
import { FinancialTable } from './components/FinancialTable';
import { CategoryManager } from './components/CategoryManager';
import { FinancialCharts } from './components/FinancialCharts';
import { SummaryCard } from './components/SummaryCard';
import { MonthManager } from './components/MonthManager';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, auth, signOut, onAuthStateChanged, User as FirebaseUser } from './firebase';
import { Theme } from './types';
import * as XLSX from 'xlsx';

// Login Component for standard Authentication
const LoginScreen = ({ onLogin }: { onLogin: (role: 'view' | 'edit') => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isSetupMode, setIsSetupMode] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const id = userId.toUpperCase();
    if (id !== 'APPOINTYVIEW' && id !== 'APPOINTYEDIT') {
      setError('Invalid User ID. Please use APPOINTYVIEW (view) or APPOINTYEDIT (full edit).');
      setLoading(false);
      return;
    }

    const email = `${id.toLowerCase()}@appointy.com`;
    const role = id === 'APPOINTYVIEW' ? 'view' : 'edit';

    try {
      if (isSetupMode) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin(role);
    } catch (err: any) {
      console.error("Authentication error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError("Invalid ID or Password. If this is your first time, check 'First time? Setup Accounts'.");
      } else {
        setError(err.message || "Failed authenticate credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 dark:bg-blue-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200 dark:shadow-none">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Appointy MIS Portal</h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isSetupMode ? 'Create corporate credentials (first time)' : 'Sign in with APPOINTYVIEW / APPOINTYEDIT'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50/50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-800/55 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-2">
            <X className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400"
              placeholder="APPOINTYVIEW or APPOINTYEDIT"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-100 dark:shadow-none disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSetupMode ? 'Setup Accounts' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => setIsSetupMode(!isSetupMode)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {isSetupMode ? 'Already have credentials? Return to Sign In' : "Don't have credentials? Setup Accounts"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const store = useMISStore();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'view' | 'edit'>('view');
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'p&l' | 'charts' | 'categories'>('p&l');

  // Session Inactivity Management
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionCountdown, setSessionCountdown] = useState(60);
  const lastActiveRef = React.useRef<number>(Date.now());

  // Load configuration and credentials
  useEffect(() => {
    store.loadFromLocal();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      if (currentUser) {
        const email = currentUser.email?.toLowerCase();
        const role = email === 'appointyedit@appointy.com' ? 'edit' : 'view';
        setUserRole(role);
        store.setUserRole(role);
        store.setUserEmail(currentUser.email);
      } else {
        setUserRole('view');
        store.setUserRole('view');
        store.setUserEmail(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (role: 'view' | 'edit') => {
    setUserRole(role);
    store.setUserRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setUser(null);
      store.setUserEmail(null);
      store.setUserRole('view');
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  // Inactivity tracking effect
  useEffect(() => {
    if (!isAuthenticated) {
      setShowSessionWarning(false);
      return;
    }

    lastActiveRef.current = Date.now();

    const handleUserActivity = () => {
      if (!showSessionWarning) {
        lastActiveRef.current = Date.now();
      }
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach(evt => {
      window.addEventListener(evt, handleUserActivity);
    });

    const checkInterval = setInterval(() => {
      const elapsedMs = Date.now() - lastActiveRef.current;
      const elapsedSec = Math.floor(elapsedMs / 1000);

      const nineMinutes = 9 * 60; // 540 seconds
      const tenMinutes = 10 * 60; // 600 seconds

      if (elapsedSec >= tenMinutes) {
        clearInterval(checkInterval);
        handleLogout();
        setShowSessionWarning(false);
      } else if (elapsedSec >= nineMinutes) {
        setShowSessionWarning(true);
        const remaining = tenMinutes - elapsedSec;
        setSessionCountdown(Math.max(0, remaining));
      } else {
        setShowSessionWarning(false);
      }
    }, 1000);

    return () => {
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, handleUserActivity);
      });
      clearInterval(checkInterval);
    };
  }, [isAuthenticated, showSessionWarning]);

  // Session extension action handler
  const extendSession = () => {
    lastActiveRef.current = Date.now();
    setShowSessionWarning(false);
  };

  // Memoize top KPI calculations derived directly from state items to prevent recalculation overhead
  const derivedKPIs = useMemo(() => {
    const revenueItems = store.revenueItems;
    const expenseItems = store.expenseItems;
    const months = store.months;

    let totalRevenue = 0;
    let totalExpense = 0;

    // Calculate sum of active parent roots for revenue
    months.forEach(m => {
      const roots = revenueItems.filter(item => item.parentId === null);
      roots.forEach(root => {
        const children = revenueItems.filter(c => c.parentId === root.id);
        if (children.length > 0) {
          totalRevenue += children.reduce((s, c) => s + (c.monthlyValues[m] || 0), 0);
        } else {
          totalRevenue += root.monthlyValues[m] || 0;
        }
      });

      // Sum all operating expenses
      totalExpense += expenseItems.reduce((s, item) => s + (item.monthlyValues[m] || 0), 0);
    });

    const ebitda = totalRevenue - totalExpense;
    const netMargin = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;

    return {
      revenue: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalRevenue),
      expense: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalExpense),
      ebitda: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(ebitda),
      isEbitdaNegative: ebitda < 0,
      margin: `${netMargin.toFixed(1)}%`,
      isMarginNegative: netMargin < 0,
    };
  }, [store.revenueItems, store.expenseItems, store.months]);

  // Export spreadsheet P&L as highly structured native excel worksheets via xlsx sheet builders
  const handleExcelExport = () => {
    const months = store.months;
    const data: any[][] = [
      ['Appointy Corporate Financial Statement 2025', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['P&L MIS Balance Workspace', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      [],
      ['Line Item Header', ...months, 'Annual Total'],
      ['REVENUE STREAMS', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ];

    // Compute root lines and child levels
    const roots = store.revenueItems.filter(item => item.parentId === null);
    roots.forEach(root => {
      const children = store.revenueItems.filter(c => c.parentId === root.id);
      const isParent = children.length > 0;

      let rootMonthly: Record<string, number> = { ...root.monthlyValues };
      if (isParent) {
        rootMonthly = {};
        months.forEach(m => {
          rootMonthly[m] = children.reduce((s, c) => s + (c.monthlyValues[m] || 0), 0);
        });
      }

      const rootTotal = months.reduce((s, m) => s + (rootMonthly[m] || 0), 0);
      data.push([root.name, ...months.map(m => rootMonthly[m] || 0), rootTotal]);

      if (isParent) {
        children.forEach(child => {
          const childTotal = months.reduce((s, m) => s + (child.monthlyValues[m] || 0), 0);
          data.push([`  ${child.name}`, ...months.map(m => child.monthlyValues[m] || 0), childTotal]);
        });
      }
    });

    data.push([]);
    data.push(['OPERATING EXPENSES', '', '', '', '', '', '', '', '', '', '', '', '', '']);

    store.expenseItems.forEach(exp => {
      const expTotal = months.reduce((s, m) => s + (exp.monthlyValues[m] || 0), 0);
      data.push([exp.name, ...months.map(m => exp.monthlyValues[m] || 0), expTotal, exp.notes || '']);
    });

    // Subtotals calculations
    data.push([]);
    const monthlyRevList = months.map(m => {
      return roots.reduce((sum, root) => {
        const children = store.revenueItems.filter(c => c.parentId === root.id);
        if (children.length > 0) {
          return sum + children.reduce((s, c) => s + (c.monthlyValues[m] || 0), 0);
        }
        return sum + (root.monthlyValues[m] || 0);
      }, 0);
    });

    const monthlyExpList = months.map(m => {
      return store.expenseItems.reduce((s, exp) => s + (exp.monthlyValues[m] || 0), 0);
    });

    const annualRev = monthlyRevList.reduce((s, v) => s + v, 0);
    const annualExp = monthlyExpList.reduce((s, v) => s + v, 0);

    data.push(['Grand Total Revenue', ...monthlyRevList, annualRev]);
    data.push(['Grand Total Expenses', ...monthlyExpList, annualExp]);
    data.push(['EBITDA', ...monthlyRevList.map((rev, idx) => rev - monthlyExpList[idx]), annualRev - annualExp]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'P&L Statement');
    XLSX.writeFile(wb, `appointy_financial_mis_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleBulkUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        // Use the first sheet
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        
        // Convert sheet to 2D array
        const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
        if (!rows || rows.length === 0) {
          alert('Failed to parse spreadsheet: empty rows.');
          return;
        }

        // Search for a row containing month patterns to use as header map
        let headerRowIdx = -1;
        let bestHeadersMatch: { index: number; month: string }[] = [];

        for (let i = 0; i < Math.min(row_count_limit(), rows.length); i++) {
          const row = rows[i];
          if (!row) continue;
          
          const matches: { index: number; month: string }[] = [];
          row.forEach((cell, idx) => {
            if (typeof cell === 'string') {
              const cleaned = cell.trim();
              const foundMonth = store.months.find(m => 
                cleaned.toLowerCase() === m.toLowerCase() ||
                cleaned.toLowerCase().replace(/[^a-z0-9]/g, '') === m.toLowerCase().replace(/[^a-z0-9]/g, '')
              );
              if (foundMonth) {
                matches.push({ index: idx, month: foundMonth });
              }
            }
          });

          if (matches.length > bestHeadersMatch.length) {
            bestHeadersMatch = matches;
            headerRowIdx = i;
          }
        }

        function row_count_limit() {
          return 25;
        }

        if (bestHeadersMatch.length === 0) {
          // Fallback mechanism: check if first row or common headers match months
          alert('Could not find columns in Excel matching your tracking periods (e.g. "Jan 26", "Feb 26", etc.)');
          return;
        }

        // Parse matching data rows
        const parsedData: { name: string; values: Record<string, number> }[] = [];

        rows.forEach((row, rIdx) => {
          if (rIdx === headerRowIdx || !row) return;

          // Find the first string cell as name candidate
          let nameVal = '';
          for (let colIdx = 0; colIdx < row.length; colIdx++) {
            const cell = row[colIdx];
            if (typeof cell === 'string' && cell.trim().length > 1) {
              const isHeaderCell = bestHeadersMatch.some(h => h.index === colIdx);
              if (!isHeaderCell) {
                nameVal = cell.trim();
                break;
              }
            }
          }

          if (!nameVal) return; // Skip row if no string label found

          // Build monthly values dictionary
          const monthlyValues: Record<string, number> = {};
          bestHeadersMatch.forEach(h => {
            const rawVal = row[h.index];
            let parsedVal = 0;
            if (typeof rawVal === 'number') {
              parsedVal = rawVal;
            } else if (typeof rawVal === 'string') {
              parsedVal = parseFloat(rawVal.replace(/[^0-9.-]/g, ''));
            }
            monthlyValues[h.month] = isNaN(parsedVal) ? 0 : parsedVal;
          });

          parsedData.push({
            name: nameVal,
            values: monthlyValues
          });
        });

        if (parsedData.length === 0) {
          alert('No structured financial categories or accounts matched in the Excel sheet.');
          return;
        }

        store.bulkUploadFinancialData(parsedData);
      } catch (err: any) {
        console.error('File Upload Error:', err);
        alert(`Error compiling Excel upload structure: ${err.message || String(err)}`);
      }
    };

    reader.readAsBinaryString(file);
    // Reset file input target
    e.target.value = '';
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto animate-duration-1000" />
          <p className="text-xs font-bold text-slate-500 animate-pulse">Launching Appointy workspace environment...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150`}>
      {/* Dynamic Sync Status bar notifications */}
      {store.syncStatus && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 max-w-sm animate-bounce ${
          store.syncStatus.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
            : store.syncStatus.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
            : 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
        }`}>
          <span>{store.syncStatus.message}</span>
          <button onClick={() => store.clearSyncStatus()} className="p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded ml-auto">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Global Application Header navigation */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row md:items-center justify-between shadow-2xs select-none printing-hide gap-3">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm shadow-blue-200 dark:shadow-none shrink-0">
              <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-950 dark:text-white leading-none">
                Appointy Corporate MIS
              </h1>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 sm:mt-1">
                Financial Management System
              </p>
            </div>
          </div>
        </div>

        {/* Global Action items */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 sm:gap-4 w-full md:w-auto">
          {/* Real-time search query feed - visible on desktop, customized on mobile */}
          <div className="relative w-full md:w-52">
            <input
              type="text"
              value={store.searchFilter}
              onChange={(e) => store.setSearchFilter(e.target.value)}
              placeholder="Query spreadsheet line..."
              className="text-xs font-semibold bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-850 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full placeholder-slate-400 transition-all"
            />
          </div>

          <div className="flex items-center justify-between w-full md:w-auto gap-2">
            {/* Sync control module */}
            <div className="flex items-center gap-1 sm:gap-1.5 border-r border-slate-200 dark:border-slate-800 pr-3 sm:pr-4">
              <button
                onClick={() => store.pullFromCloud()}
                disabled={store.isSyncing}
                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                title="Pull backup from cloud db"
              >
                <CloudDownload className="w-4 h-4 text-slate-500" />
              </button>
              {userRole === 'edit' && (
                <button
                  onClick={() => store.pushToCloud()}
                  disabled={store.isSyncing}
                  className="p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors cursor-pointer disabled:opacity-50"
                  title="Publish changes to cloud db"
                >
                  <CloudUpload className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Account/Auth role display info */}
            <div className="flex items-center gap-1.5 xs:gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-1 sm:py-1.5 min-w-0">
              <div className={`w-1.5 sm:w-2.2 h-1.5 sm:h-2.2 rounded-full shrink-0 ${userRole === 'edit' ? 'bg-blue-500 animate-pulse' : 'bg-amber-400'}`} />
              <div className="text-left shrink-0 min-w-0">
                <p className="text-[7px] sm:text-[9px] font-black uppercase tracking-wider text-slate-500 leading-none">
                  {userRole === 'edit' ? 'Editor' : 'Viewer'}
                </p>
                <span className="text-[8px] sm:text-[9px] font-semibold text-slate-400 dark:text-slate-500 truncate block max-w-[50px] sm:max-w-[70px]">
                  {user?.email?.split('@')[0]}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer pl-2 shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* KPI Summaries grid row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 printing-grid">
          <SummaryCard
            id="tot-rev"
            title="Total Revenue (YTD)"
            value={derivedKPIs.revenue}
            color="emerald"
            icon={DollarSign}
            trend="up"
          />
          <SummaryCard
            id="tot-exp"
            title="Total Expense (YTD)"
            value={derivedKPIs.expense}
            color="rose"
            icon={TrendingUp}
            trend="down"
          />
          <SummaryCard
            id="tot-ebitda"
            title="Profit"
            value={derivedKPIs.ebitda}
            color={derivedKPIs.isEbitdaNegative ? "rose" : "blue"}
            icon={Activity}
            trend={derivedKPIs.isEbitdaNegative ? "down" : "up"}
          />
          <SummaryCard
            id="tot-margin"
            title="Net Margin %"
            value={derivedKPIs.margin}
            color={derivedKPIs.isMarginNegative ? "rose" : "violet"}
            icon={TrendingUp}
            trend={derivedKPIs.isMarginNegative ? "down" : "up"}
          />
        </section>

        {/* Workspace Toolbar Controls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 select-none printing-hide shadow-2xs">
          {/* Tab Selection */}
          <div className="flex bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-inner overflow-x-auto w-full md:w-auto">
            <button
              onClick={() => setSelectedTab('p&l')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                selectedTab === 'p&l'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4.5 h-4.5" />
              <span>Spreadsheet Grid</span>
            </button>
            <button
              onClick={() => setSelectedTab('charts')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                selectedTab === 'charts'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              <span>Charts Analysis</span>
            </button>
            {userRole === 'edit' && (
              <button
                onClick={() => setSelectedTab('categories')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  selectedTab === 'categories'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Settings className="w-4.5 h-4.5" />
                <span>Manage Elements</span>
              </button>
            )}
          </div>

          {/* Action button triggers */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={handlePrintPDF}
              className="flex-1 md:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-blue-200 font-sans cursor-pointer transition-all"
            >
              <Eye className="w-4.5 h-4.5" />
              <span>Print/PDF Statement</span>
            </button>
          </div>
        </div>

        {/* Selected Workspace Panel Display */}
        <section className="transition-all duration-300">
          {selectedTab === 'p&l' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2 py-0.5 printing-hide">
                <div />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <span>Spreadsheet Nav enabled</span>
                </span>
              </div>
              <FinancialTable />
            </div>
          )}

          {selectedTab === 'charts' && <FinancialCharts />}

          {selectedTab === 'categories' && userRole === 'edit' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CategoryManager type="revenue" />
                <CategoryManager type="expense" />
              </div>
              <MonthManager />
            </div>
          )}
        </section>
      </main>

      {/* Global Application Footer */}
      <footer className="py-8 bg-white border-t border-slate-100 mt-20 dark:bg-slate-900 dark:border-slate-800/60 transition-colors select-none printing-hide">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 font-semibold gap-4">
          <p>© 2026 Appointy Financial, Inc. Secured Cloud Sandbox.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-900 dark:hover:text-white">Confidentiality Agreement</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white">Security Systems</a>
          </div>
        </div>
      </footer>

      {/* Session Inactivity Warning Modal */}
      {showSessionWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs select-none">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6 text-center transform scale-100 transition-all">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Inactivity Warning
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                Your sandbox session will automatically expire soon due to lack of keyboard or cursor activity.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl py-4 px-6 border border-slate-100 dark:border-slate-850 animate-pulse">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                Logging out in
              </span>
              <span className="text-3xl font-black text-rose-500 font-mono tracking-wider">
                {sessionCountdown}s
              </span>
            </div>

            <button
              onClick={extendSession}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-100/50 dark:shadow-none flex items-center justify-center gap-2 cursor-pointer"
            >
              Extend Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
