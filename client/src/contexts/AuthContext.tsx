import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  color: string;
  emoji: string;
  is_admin?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (token: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((u: AuthUser) => setUser(u))
      .catch(() => { localStorage.removeItem('auth_token'); setToken(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const r = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
    });
    if (!r.ok) {
      let msg = 'Erreur de connexion';
      try { const err = await r.json(); msg = err.error ?? msg; } catch {}
      throw new Error(msg);
    }
    const { token: t, member } = await r.json();
    try { localStorage.setItem('auth_token', t); } catch {} // blocked in iOS private mode
    setToken(t);
    setUser(member);
    return member;
  };

  const register = async (inviteToken: string, password: string): Promise<AuthUser> => {
    const r = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: inviteToken, password }),
    });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.error ?? 'Erreur lors de la création du compte');
    }
    const { token: t, member } = await r.json();
    localStorage.setItem('auth_token', t);
    setToken(t);
    setUser(member);
    return member;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
