
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import type { LoginFormData } from '@/lib/schemas';

interface UserProfile {
  cargo: string | null;
  username: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  cargo: string | null;
  username: string | null;
  isLoading: boolean;
  login: (data: LoginFormData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserProfile(user: User | null): Promise<UserProfile | null> {
  if (!user) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('cargo, username')
      .eq('id', user.id)
      .single();

    if (error) {
      console.warn('Could not fetch user profile:', error.message);
      return null;
    }
    return data ? { cargo: data.cargo, username: data.username } : null;
  } catch (err) {
    console.error('Unexpected error fetching profile:', err);
    return null;
  }
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cargo, setCargo] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const updateUserSession = async (session: Session | null) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
            const profile = await fetchUserProfile(currentUser);
            setCargo(profile?.cargo || null);
            setUsername(profile?.username || null);
        } else {
            setCargo(null);
            setUsername(null);
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
    // Server-side check for environment variables in Cloud Run
    if (typeof window === 'undefined' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      console.error("Supabase environment variables not found on the server.");
      return { success: false, error: "Erro de configuração do servidor: As chaves do Supabase não foram encontradas." };
    }
    
    const { data: email, error: rpcError } = await supabase
      .rpc('get_email_for_login', { p_login_identifier: data.username });

    if (rpcError) {
      console.error("Erro na função RPC 'get_email_for_login':", rpcError.message);
      const specificError = rpcError.message.includes('fetch') 
        ? "Erro de conexão com o servidor. Verifique as configurações de CORS no Supabase." 
        : `Falha ao consultar o usuário. Detalhes: ${rpcError.message}`;
      return { success: false, error: specificError };
    }

    if (!email) {
      return { success: false, error: "Usuário ou senha inválidos." };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: data.password,
    });

    if (signInError) {
        return { success: false, error: "Usuário ou senha inválidos." };
    }
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const value = {
    isAuthenticated: !!user,
    user,
    cargo,
    username,
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
