
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
// import { useLocalStorage } from '@/hooks/useLocalStorage'; // Removed useLocalStorage
import type { LoginFormData } from '@/lib/schemas';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginFormData) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); // Use useState
  const [isLoading, setIsLoading] = useState(true); // Keep isLoading for initial setup

  useEffect(() => {
    // Simulating the end of initial loading.
    // In a real app with a backend, you might check for an existing session token here.
    // For now, we assume the user is not authenticated initially.
    setIsLoading(false);
  }, []);

  const login = async (data: LoginFormData): Promise<boolean> => {
    setIsLoading(true);
    // TODO: Replace with a real API call to your authentication backend
    // const response = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify(data) });
    // if (response.ok) {
    //   setIsAuthenticated(true);
    //   setIsLoading(false);
    //   return true;
    // }

    // Simulate API call (current mock logic)
    await new Promise(resolve => setTimeout(resolve, 500));
    if (
      (data.username === 'adm' && data.password === 'PortoVale102030@@') ||
      (data.username === 'GRE' && data.password === 'PortoVale102030@@')
    ) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    }
    setIsAuthenticated(false);
    setIsLoading(false);
    return false;
  };

  const logout = async () => { // Made async to simulate API call
    // TODO: Implement API call to invalidate session on the backend
    // await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
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
