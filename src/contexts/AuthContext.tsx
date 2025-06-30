
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
    // Etapa 1: Obter o e-mail a partir do identificador de login (username ou email)
    const { data: email, error: rpcError } = await supabase
      .rpc('get_email_for_login', { p_login_identifier: data.username });

    if (rpcError) {
      // Log do erro real para o desenvolvedor no console
      console.error("Erro na função RPC 'get_email_for_login':", rpcError.message);
      // Mensagem genérica para o usuário por segurança
      return { success: false, error: "Usuário ou senha inválidos." };
    }

    if (!email) {
      // Acontece se o username/email não foi encontrado no banco de dados.
      // Esta é uma falha de login normal, não um erro do sistema.
      return { success: false, error: "Usuário ou senha inválidos." };
    }

    // Etapa 2: Fazer login com o e-mail recuperado e a senha fornecida
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: data.password,
    });

    if (signInError) {
        // Aqui, sabemos que o email existe, então o erro é provavelmente a senha.
        // O Supabase retorna "Invalid login credentials" para ambos, então a mensagem genérica é mais segura.
        return { success: false, error: "Usuário ou senha inválidos." };
    }

    // Após o login bem-sucedido, o listener onAuthStateChange irá atualizar o usuário e o cargo
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    // O listener onAuthStateChange irá limpar o usuário e o cargo
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
