import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient, type AuthUser, type Session } from '~/lib/supabase/client';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('useSupabaseAuth');

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

export interface AuthHookReturn extends AuthState, AuthActions {}

/**
 * Hook para gerenciar autenticação Supabase
 * Implementa progressive enhancement - funciona sem autenticação como fallback
 */
export function useSupabaseAuth(): AuthHookReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  const supabase = getSupabaseClient();

  // Inicializar estado de autenticação
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        logger.debug('Initializing auth state...');

        // Verificar sessão existente
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          logger.error('Error getting session:', error);

          if (mounted) {
            setState((prev) => ({
              ...prev,
              loading: false,
              error: error.message,
            }));
          }

          return;
        }

        if (mounted) {
          setState((prev) => ({
            ...prev,
            user: session?.user ?? null,
            session,
            loading: false,
            error: null,
          }));
        }

        logger.debug('Auth state initialized:', {
          hasUser: !!session?.user,
          userId: session?.user?.id,
        });
      } catch (error) {
        logger.error('Failed to initialize auth:', error);

        if (mounted) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'Failed to initialize authentication',
          }));
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [supabase.auth]);

  // Listener para mudanças de autenticação
  useEffect(() => {
    logger.debug('Setting up auth state listener...');

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      logger.debug('Auth state changed:', { event, hasUser: !!session?.user });

      setState((prev) => ({
        ...prev,
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
      }));

      // Log evento para depuração
      if (event === 'SIGNED_IN') {
        logger.info('User signed in:', session?.user?.email);
      } else if (event === 'SIGNED_OUT') {
        logger.info('User signed out');
      } else if (event === 'TOKEN_REFRESHED') {
        logger.debug('Token refreshed');
      }
    });

    return () => {
      logger.debug('Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // Função de login
  const signIn = useCallback(
    async (email: string, password: string) => {
      logger.debug('Attempting sign in for:', email);

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          logger.error('Sign in error:', error);
          setState((prev) => ({
            ...prev,
            loading: false,
            error: getAuthErrorMessage(error.message),
          }));

          return { success: false, error: getAuthErrorMessage(error.message) };
        }

        logger.info('Sign in successful');

        return { success: true };
      } catch (error) {
        const errorMessage = 'Failed to sign in. Please try again.';
        logger.error('Sign in exception:', error);
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));

        return { success: false, error: errorMessage };
      }
    },
    [supabase.auth],
  );

  // Função de cadastro
  const signUp = useCallback(
    async (email: string, password: string) => {
      logger.debug('Attempting sign up for:', email);

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        });

        if (error) {
          logger.error('Sign up error:', error);
          setState((prev) => ({
            ...prev,
            loading: false,
            error: getAuthErrorMessage(error.message),
          }));

          return { success: false, error: getAuthErrorMessage(error.message) };
        }

        logger.info('Sign up successful - check email for confirmation');

        return { success: true };
      } catch (error) {
        const errorMessage = 'Failed to create account. Please try again.';
        logger.error('Sign up exception:', error);
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));

        return { success: false, error: errorMessage };
      }
    },
    [supabase.auth],
  );

  // Função de logout
  const signOut = useCallback(async () => {
    logger.debug('Attempting sign out');

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('Sign out error:', error);
        setState((prev) => ({ ...prev, error: 'Failed to sign out' }));

        return;
      }

      logger.info('Sign out successful');
    } catch (error) {
      logger.error('Sign out exception:', error);
      setState((prev) => ({ ...prev, error: 'Failed to sign out' }));
    }
  }, [supabase.auth]);

  // Função de reset de senha
  const resetPassword = useCallback(
    async (email: string) => {
      logger.debug('Attempting password reset for:', email);

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/reset-password` : undefined,
        });

        if (error) {
          logger.error('Password reset error:', error);
          return { success: false, error: getAuthErrorMessage(error.message) };
        }

        logger.info('Password reset email sent');

        return { success: true };
      } catch (error) {
        logger.error('Password reset exception:', error);
        return { success: false, error: 'Failed to send reset email. Please try again.' };
      }
    },
    [supabase.auth],
  );

  // Limpar erro
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
  };
}

/**
 * Converte mensagens de erro do Supabase para mensagens mais amigáveis
 */
function getAuthErrorMessage(error: string): string {
  const errorLower = error.toLowerCase();

  if (errorLower.includes('invalid login credentials')) {
    return 'Email ou senha incorretos. Verifique suas credenciais.';
  }

  if (errorLower.includes('email not confirmed')) {
    return 'Email não confirmado. Verifique sua caixa de entrada.';
  }

  if (errorLower.includes('too many requests')) {
    return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
  }

  if (errorLower.includes('weak password')) {
    return 'Senha muito fraca. Use pelo menos 6 caracteres.';
  }

  if (errorLower.includes('email already registered')) {
    return 'Este email já está cadastrado. Tente fazer login ou recuperar sua senha.';
  }

  if (errorLower.includes('invalid email')) {
    return 'Email inválido. Verifique o formato do email.';
  }

  // Fallback para erros não mapeados
  return error || 'Erro desconhecido. Tente novamente.';
}

/**
 * Hook simples para verificar se o usuário está autenticado
 */
export function useAuth() {
  const { user, loading } = useSupabaseAuth();
  return { isAuthenticated: !!user, user, loading };
}
