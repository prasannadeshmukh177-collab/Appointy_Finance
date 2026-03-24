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
import AIChatbot from './components/AIChatbot';
import { AuthProvider, useAuth } from './AuthContext';

const AppointyLogo = ({ className }: { className?: string }) => (
  <div className={cn("bg-[#007AFF] rounded-xl flex items-center justify-center shadow-sm", className)}>
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[24px] p-8 w-full max-w-sm shadow-2xl border border-[#E5E5EA] transform animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 bg-[#F2F2F7] rounded-2xl flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-[#007AFF]" />
          </div>
          <h2 className="text-[20px] font-bold text-black">Admin Access</h2>
          <p className="text-[#8E8E93] text-[13px] mt-1">Enter password to manage workspace</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={cn(
                "w-full px-4 py-3 bg-[#F2F2F7] rounded-xl border border-transparent focus:border-[#007AFF]/30 focus:bg-white outline-none transition-all text-[15px] font-medium",
                error && "border-red-200 bg-red-50 focus:border-red-500"
              )}
              placeholder="Password"
              autoFocus
              disabled={isSubmitting}
            />
            {error && (
              <p className="text-[12px] text-red-500 font-medium mt-2 px-1">{error}</p>
            )}
          </div>
          
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-[#F2F2F7] text-black font-bold rounded-xl hover:bg-[#E5E5EA] transition-all text-[14px]"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || !password}
              className="flex-1 px-4 py-3 bg-[#007AFF] text-white font-bold rounded-xl hover:bg-[#0062CC] transition-all text-[14px] disabled:opacity-50 flex items-center justify-center gap-2"
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
    <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
      <div className="flex items-center gap-4">
        <AppointyLogo className="h-12 w-12" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[24px] font-bold text-black tracking-tight leading-none">
              Appointy Scheduler
            </h1>
            <div 
              className={cn(
                "w-2 h-2 rounded-full mt-1",
                systemStatus === 'online' ? "bg-emerald-500" : 
                systemStatus === 'offline' ? "bg-red-500" : 
                "bg-[#C7C7CC] animate-pulse"
              )}
            />
          </div>
          <p className="text-[#8E8E93] text-[13px] font-medium mt-1">Prasanna's Workspace</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <Navigation />
        
        {isAuthenticated ? (
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-[#8E8E93] hover:text-[#FF3B30] transition-all font-bold text-[14px]"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        ) : (
          <button 
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-full hover:bg-zinc-800 transition-all font-bold text-[13px]"
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
    <nav className="flex items-center gap-1 bg-[#F2F2F7] rounded-full p-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-full transition-all font-bold text-[13px]",
              isActive 
                ? "bg-white text-[#007AFF] shadow-sm" 
                : "text-[#8E8E93] hover:text-black"
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
        <div className="min-h-screen bg-[#F2F2F7] p-4 md:p-8 text-black font-sans">
          <div className="max-w-7xl mx-auto">
            <Header />

            <main className="bg-white rounded-[32px] p-6 md:p-10 min-h-[calc(100vh-200px)] shadow-sm border border-[#E5E5EA]">
              <Routes>
                <Route path="/" element={<CalendarView />} />
                <Route path="/board" element={<BoardView />} />
                <Route path="/queue" element={<QueueView />} />
              </Routes>
            </main>
          </div>
          <AIChatbot />
        </div>
      </Router>
    </AuthProvider>
  );
}
