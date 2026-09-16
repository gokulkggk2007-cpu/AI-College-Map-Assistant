import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/campus';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole, department: string, year?: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<string>;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load persistent session on boot
  useEffect(() => {
    const savedToken = localStorage.getItem('campus_map_auth_token');
    if (savedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.user) {
            setUser(data.user);
            setToken(savedToken);
          } else {
            localStorage.removeItem('campus_map_auth_token');
          }
        })
        .catch(() => {
          localStorage.removeItem('campus_map_auth_token');
        })
        .finally(() => setIsLoading(false));
    } else {
      // Default to student demo user for seamless instant exploration
      switchDemoRole('student').finally(() => setIsLoading(false));
    }
  }, []);

  const login = async (email: string, password = 'password123') => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed');
    }
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('campus_map_auth_token', data.token);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    department: string,
    year?: string
  ) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, department, year }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('campus_map_auth_token', data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('campus_map_auth_token');
  };

  const forgotPassword = async (email: string) => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset request failed');
    return data.message;
  };

  const switchDemoRole = async (role: UserRole) => {
    const emails: Record<UserRole, string> = {
      admin: 'admin@college.edu',
      staff: 'staff@college.edu',
      student: 'student@college.edu',
    };
    try {
      await login(emails[role], 'password123');
    } catch (e) {
      console.warn('Demo switch error', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        forgotPassword,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
