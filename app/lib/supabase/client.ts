import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('supabase.client');

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          plan_id: string;
          budget_remaining: number;
          plan_start_date: string;
          daily_usage: number;
          daily_usage_date: string;
          request_count_today: number;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          plan_id?: string;
          budget_remaining?: number;
          plan_start_date?: string;
          daily_usage?: number;
          daily_usage_date?: string;
          request_count_today?: number;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          plan_id?: string;
          budget_remaining?: number;
          plan_start_date?: string;
          daily_usage?: number;
          daily_usage_date?: string;
          request_count_today?: number;
        };
      };
      chats: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          role: 'user' | 'assistant';
          content: string;
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          role: 'user' | 'assistant';
          content: string;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          metadata?: any;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          code?: string;
          created_at?: string;
        };
      };
    };
  };
}

// Cliente Supabase usando as credenciais do ambiente
let supabaseClient: SupabaseClient<Database> | null = null;

/**
 * Obtém ou cria o cliente Supabase com as credenciais do ambiente
 * Usando as credenciais do arquivo .env
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseClient) {
    /*
     * Obter credenciais do ambiente (ordem de precedência):
     * 1) import.meta.env (Vite - disponível já no bundle do cliente)
     * 2) window.ENV (injetado pelo loader do Remix)
     * 3) process.env (lado servidor/dev)
     */
    const isBrowser = typeof window !== 'undefined';
    const viteEnv = (import.meta as any)?.env || {};

    let supabaseUrl: string | undefined =
      (viteEnv.SUPABASE_URL as string | undefined) ||
      (isBrowser ? (window as any)?.ENV?.SUPABASE_URL : undefined) ||
      (process.env.SUPABASE_URL as string | undefined);

    let supabaseAnonKey: string | undefined =
      (viteEnv.SUPABASE_ANON_KEY as string | undefined) ||
      (isBrowser ? (window as any)?.ENV?.SUPABASE_ANON_KEY : undefined) ||
      (process.env.SUPABASE_ANON_KEY as string | undefined);

    // Fallback seguro em desenvolvimento para evitar quebra da aplicação
    if (
      (!supabaseUrl || !supabaseAnonKey) &&
      (viteEnv.MODE === 'development' || process.env.NODE_ENV === 'development')
    ) {
      logger.warn('Supabase env vars not found in client. Falling back to development defaults');
      supabaseUrl = supabaseUrl || 'https://jhvsuubkknhdrpwfjsrc.supabase.co';
      supabaseAnonKey =
        supabaseAnonKey ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodnN1dWJra25oZHJwd2Zqc3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzUzODUsImV4cCI6MjA3MDAxMTM4NX0.BIinCC-RB3Il_atDAMjHcElL4zEx8UX6ak7LCWpa_qY';
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error('Supabase configuration missing', {
        source: {
          fromVite: Boolean(viteEnv?.SUPABASE_URL && viteEnv?.SUPABASE_ANON_KEY),
          fromWindow:
            isBrowser && Boolean((window as any)?.ENV?.SUPABASE_URL && (window as any)?.ENV?.SUPABASE_ANON_KEY),
          fromProcess: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
        },
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
      });
      throw new Error('Supabase configuration is missing. Please check your environment variables.');
    }

    try {
      supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
        global: {
          headers: {
            'X-Client-Info': 'bolt-diy@1.0.0',
          },
        },
      });

      logger.info('Supabase client initialized successfully', {
        url: supabaseUrl,
        keyLength: supabaseAnonKey.length,
      });
    } catch (error) {
      logger.error('Failed to initialize Supabase client:', error);
      throw error;
    }
  }

  return supabaseClient;
}

/**
 * Alias para facilitar importação
 */
export const supabase = getSupabaseClient();

/**
 * Types para facilitar uso
 */
export type User = Database['public']['Tables']['users']['Row'];
export type Chat = Database['public']['Tables']['chats']['Row'];
export type ChatMessage = Database['public']['Tables']['messages']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];

/**
 * Tipos de autenticação do Supabase
 */
export type { User as AuthUser, Session } from '@supabase/supabase-js';
