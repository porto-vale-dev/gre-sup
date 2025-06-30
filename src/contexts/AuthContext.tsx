
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import type { LoginFormData } from '@/lib/schemas';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  cargo: string | null;
  isLoading: boolean;
  login: (data: LoginFormData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserCargo(user: User | null): Promise<string | null> {
  if (!user) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('cargo')
      .eq('id', user.id)
      .single();

    if (error) {
      // It's common for a profile to not exist immediately, so don't throw.
      console.warn('Could not fetch user profile:', error.message);
      return null;
    }
    return data?.cargo || null;
  } catch (err) {
    console.error('Unexpected error fetching profile:', err);
    return null;
  }
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cargo, setCargo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const updateUserSession = async (session: Session | null) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
            const userCargo = await fetchUserCargo(currentUser);
            setCargo(userCargo);
        } else {
            setCargo(null);
        }
        setIsLoading(false);
    };

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await updateUserSession(session);
    };
    
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        await updateUserSession(session);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (data: LoginFormData): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.username,
      password: data.password,
    });

    if (error) {
        let friendlyMessage = "Usuário ou senha inválidos.";
        if (error.message.includes("Invalid login credentials")) {
            friendlyMessage = "Credenciais de login inválidas. Verifique seu e-mail e senha.";
        } else if (error.message.includes("Email not confirmed")) {
            friendlyMessage = "Por favor, confirme seu e-mail antes de fazer login.";
        }
        return { success: false, error: friendlyMessage };
    }
    // After successful login, the onAuthStateChange listener will handle updating user and cargo
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    // The onAuthStateChange listener will clear user and cargo
    router.push('/');
  };

  const value = {
    isAuthenticated: !!user,
    user,
    cargo,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
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
