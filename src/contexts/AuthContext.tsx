
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
  isLoading: boolean; // Represents ONLY the initial auth check
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
  const [isLoading, setIsLoading] = useState(true); // Is the initial session still loading?
  const router = useRouter();

  // Effect for handling user profile fetching, triggered when user object changes
  useEffect(() => {
    if (user) {
      // Fetch profile in the background
      fetchUserProfile(user).then((profile) => {
        setCargo(profile?.cargo || null);
        setUsername(profile?.username || null);
      });
    } else {
      // No user, so clear profile
      setCargo(null);
      setUsername(null);
    }
  }, [user]);

  // Effect for handling auth state changes, runs once on mount and then on every auth event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false); // Auth state is known, stop the main loading state.
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      email: email,
      password: data.password,
    });

    if (signInError) {
        return { success: false, error: "Usuário ou senha inválidos." };
    }
    // The onAuthStateChange listener will handle setting user state and triggering profile fetch.
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will handle clearing user/profile state.
    // We just need to redirect. This makes the logout flow simpler.
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
