import { createClient } from '@supabase/supabase-js';

// Configuração das credenciais do Supabase
const supabaseUrl = 'https://jhvsuubkknhdrpwfjsrc.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodnN1dWJra25oZHJwd2Zqc3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzUzODUsImV4cCI6MjA3MDAxMTM4NX0.BIinCC-RB3Il_atDAMjHcElL4zEx8UX6ak7LCWpa_qY';

// Cliente Supabase para autenticação
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Tipos para autenticação
export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  plan_id: string;
  budget_remaining: number;
  plan_start_date: string;
  daily_usage: number;
  request_count_today: number;
  created_at: string;
}

// Funções auxiliares de autenticação
export const authHelpers = {
  // Obter usuário atual
  getCurrentUser: async (): Promise<AuthUser | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user
      ? {
          id: user.id,
          email: user.email!,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
        }
      : null;
  },

  // Obter perfil do usuário
  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  },

  // Fazer login
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  },

  // Fazer registro
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Desabilita confirmação por email
      },
    });

    return { data, error };
  },

  // Login com Google
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { data, error };
  },

  // Logout
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Verificar se está autenticado
  isAuthenticated: async (): Promise<boolean> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return !!session;
  },

  // Obter sessão atual
  getSession: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  },
};
