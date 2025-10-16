
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  email: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BUILD_ID_STORAGE_KEY = 'app-build-id';

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

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(BUILD_ID_STORAGE_KEY);
    router.push('/');
  }, [router]);
  
  // 🔹 Verificação de versão do build
  useEffect(() => {
    const currentBuildId = process.env.NEXT_PUBLIC_BUILD_ID;
    const storedBuildId = localStorage.getItem(BUILD_ID_STORAGE_KEY);

    if (storedBuildId && storedBuildId !== currentBuildId) {
      console.log('New version detected. Forcing logout and refresh.');
      // Se estiver autenticado, desloga, senão apenas recarrega a página
      const { data: { session } } = supabase.auth.getSession().then(({data: {session}}) => {
          if (session) {
            logout();
          } else {
            localStorage.setItem(BUILD_ID_STORAGE_KEY, currentBuildId || '');
            window.location.reload();
          }
      });
    } else if (!storedBuildId) {
      localStorage.setItem(BUILD_ID_STORAGE_KEY, currentBuildId || '');
    }
  }, [logout]);


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

    // After a successful login, also update the build ID
    localStorage.setItem(BUILD_ID_STORAGE_KEY, process.env.NEXT_PUBLIC_BUILD_ID || '');

    return { success: true };
  };

  const value = {
    isAuthenticated: !!user,
    user,
    cargo,
    username,
    isLoading,
    login,
    logout,
    email: user?.email ?? null,
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
