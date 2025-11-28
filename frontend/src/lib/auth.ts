import { useState, useEffect } from 'react';

// A simple hook to manage user session in LocalStorage
export function useAuth() {
  const [user, setUser] = useState<{ id: string; name: string; role: 'admin' | 'agent' } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('sb_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const login = (data: any) => {
    localStorage.setItem('sb_user', JSON.stringify(data));
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem('sb_user');
    setUser(null);
    window.location.href = '/login';
  };

  return { user, login, logout };
}