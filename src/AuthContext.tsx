import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<{ success: boolean, error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  const logout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setIsAuthenticated(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const resetInactivityTimer = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (isAuthenticated) {
      timeoutRef.current = setTimeout(() => {
        console.log('Inactivity timeout reached. Logging out...');
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      const handleActivity = () => {
        resetInactivityTimer();
      };

      events.forEach(event => {
        window.addEventListener(event, handleActivity);
      });

      // Initial timer start
      resetInactivityTimer();

      return () => {
        events.forEach(event => {
          window.removeEventListener(event, handleActivity);
        });
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [isAuthenticated, resetInactivityTimer]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      const data = await response.json();
      setIsAuthenticated(!!data.authenticated);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (password: string): Promise<{ success: boolean, error?: string }> => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error('Non-JSON response received:', text);
        return { success: false, error: 'Server returned an invalid response. Please check your environment variables.' };
      }

      const data = await response.json();
      
      if (response.ok) {
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: data.error || 'Invalid credentials' };
    } catch (error: any) {
      console.error('Login failed:', error);
      return { success: false, error: 'Connection failed. The backend might be offline or misconfigured.' };
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
