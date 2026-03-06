import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/admin/me')
        .then(response => {
          setUser(response.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post('/admin/login', { email, password });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw new Error(err.response?.data?.error || 'Failed to sign in');
      }
      throw err;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const response = await api.post('/admin/register', { email, password });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw new Error(err.response?.data?.error || 'Failed to sign up');
      }
      throw err;
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
