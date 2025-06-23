
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { LoginFormData } from '@/lib/schemas';

interface AuthContextType {
  isAuthenticated: boolean;
  user: string | null;
  isLoading: boolean;
  login: (data: LoginFormData) => { success: boolean; error?: string };
  logout: () => void;
}

// Hardcoded users for local demonstration
const USERS: { [key: string]: string } = {
  'erick@portovaleconsorcios.com.br': 'Er270397@@',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useLocalStorage<string | null>('auth_user', null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This just prevents a flicker on initial load.
    // The actual state is already loaded by useLocalStorage.
    setIsLoading(false);
  }, []);

  const login = (data: LoginFormData): { success: boolean; error?: string } => {
    const expectedPassword = USERS[data.username.toLowerCase()];
    if (expectedPassword && expectedPassword === data.password) {
      setUser(data.username);
      return { success: true };
    }
    return { success: false, error: 'Usuário ou senha inválidos.' };
  };

  const logout = () => {
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout }}>
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
