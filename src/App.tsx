import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Calendar as CalendarIcon,
  Layout as BoardIcon,
  Lock,
  LogOut,
  LogIn,
  ShieldCheck
} from 'lucide-react';
import { cn } from './lib/utils';
import CalendarView from './components/CalendarView';
import BoardView from './components/BoardView';
import QueueView from './components/QueueView';
import { AuthProvider, useAuth } from './AuthContext';

const AppointyLogo = ({ className }: { className?: string }) => (
  <div className={cn("bg-[#0ea5e9] rounded-[1.25rem] flex items-center justify-center shadow-sm", className)}>
    <ShieldCheck className="text-white w-[60%] h-[60%]" strokeWidth={2.5} />
  </div>
);

function LoginModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const result = await login(password);
      if (result.success) {
        onClose();
        setPassword('');
      } else {
        setError(result.error || 'Invalid password');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] p-10 w-full max-w-md shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-slate-100 transform animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-[#0ea5e9]" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Admin Access</h2>
          <p className="text-slate-400 text-sm mt-1">Enter your password to manage the workspace</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="relative">
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={cn(
                  "w-full px-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-[#0ea5e9] focus:bg-white outline-none transition-all text-base font-medium",
                  error && "border-red-100 bg-red-50/30 focus:border-red-500"
                )}
                placeholder="••••••••••••"
                autoFocus
                disabled={isSubmitting}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 mt-3 text-red-500 bg-red-50/50 p-3 rounded-xl border border-red-100 animate-in slide-in-from-top-2 duration-300">
                <p className="text-xs font-semibold leading-tight">{error}</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || !password}
              className="flex-1 px-6 py-4 bg-[#0ea5e9] text-white font-bold rounded-2xl hover:bg-[#0284c7] shadow-lg shadow-sky-500/20 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Header() {
  const { isAuthenticated, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) setSystemStatus('online');
        else setSystemStatus('offline');
      } catch {
        setSystemStatus('offline');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 flex items-center justify-center">
          <AppointyLogo className="h-12 w-12 shadow-md shadow-sky-500/10" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[26px] font-bold text-slate-900 tracking-tight leading-none">
              Appointy Scheduler
            </h1>
            <div 
              className={cn(
                "w-2 h-2 rounded-full mt-1",
                systemStatus === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
                systemStatus === 'offline' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : 
                "bg-slate-300 animate-pulse"
              )}
              title={systemStatus === 'online' ? 'System Online' : systemStatus === 'offline' ? 'System Offline' : 'Checking Status...'}
            />
          </div>
          <p className="text-slate-400/80 text-[14px] font-medium mt-1.5">Prasanna's Workspace</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <Navigation />
        
        <div className="h-8 w-[1px] bg-slate-100 hidden md:block" />
        
        {isAuthenticated ? (
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-red-500 transition-all font-bold text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        ) : (
          <button 
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-sm shadow-lg shadow-slate-900/10"
          >
            <LogIn className="w-4 h-4" />
            Admin Login
          </button>
        )}
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </header>
  );
}

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Calendar', icon: CalendarIcon },
    { path: '/board', label: 'Board', icon: BoardIcon },
    { path: '/queue', label: 'Queue', icon: ShieldCheck },
  ];

  return (
    <nav className="flex items-center gap-1 bg-slate-50 rounded-2xl p-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-semibold text-sm",
              isActive 
                ? "bg-white text-primary shadow-sm" 
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-white p-4 md:p-8 text-slate-900">
          <div className="max-w-7xl mx-auto">
            <Header />

            <main className="bg-slate-50/50 rounded-[2.5rem] p-8 min-h-[calc(100vh-200px)] border border-slate-100">
              <Routes>
                <Route path="/" element={<CalendarView />} />
                <Route path="/board" element={<BoardView />} />
                <Route path="/queue" element={<QueueView />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}
