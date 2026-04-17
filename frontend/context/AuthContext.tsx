'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface User {
  user_id: string;
  email: string;
  username: string;
  name: string;
  picture?: string;
  role: string;
  country: string;
  default_language: string;
  credits: number;
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  username: string;
  country: string;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('esaie_token');
    if (stored) {
      setToken(stored);
      axios.get(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${stored}` } })
        .then(r => setUser(r.data))
        .catch(() => { localStorage.removeItem('esaie_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const r = await axios.post(`${API}/api/auth/login`, { email, password });
    localStorage.setItem('esaie_token', r.data.token);
    setToken(r.data.token);
    setUser(r.data.user);
  };

  const register = async (data: RegisterData) => {
    const r = await axios.post(`${API}/api/auth/register`, data);
    localStorage.setItem('esaie_token', r.data.token);
    setToken(r.data.token);
    setUser(r.data.user);
  };

  const logout = () => {
    localStorage.removeItem('esaie_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
