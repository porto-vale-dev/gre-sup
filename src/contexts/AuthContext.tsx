
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
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

  // 🔹 Verificação imediata da sessão ao carregar
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Erro ao buscar sessão:", error.message);
      }
      setUser(session?.user ?? null);
      setIsLoading(false); // <- evita loading infinito
    };

    checkSession();

    // 🔹 Listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 🔹 Quando o user muda, busca o perfil
  useEffect(() => {
    if (user) {
      fetchUserProfile(user).then((profile) => {
        setCargo(profile?.cargo || null);
        setUsername(profile?.username || null);
      });
    } else {
      setCargo(null);
      setUsername(null);
    }
  }, [user]);

  const login = async (data: LoginFormData): Promise<{ success: boolean; error?: string }> => {
    const { data: email, error: rpcError } = await supabase
      .rpc('get_email_for_login', { p_login_identifier: data.username });

    if (rpcError) {
      console.error("Erro na função RPC 'get_email_for_login':", rpcError.message);
      return { success: false, error: "Falha ao consultar o usuário. Verifique as permissões da função no Supabase." };
    }

    if (!email) {
      return { success: false, error: "Usuário ou senha inválidos." };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
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
