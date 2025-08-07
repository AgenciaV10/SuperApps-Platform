import { atom } from 'nanostores';
import type { AuthUser, UserProfile } from '~/lib/supabase/client';
import { authHelpers, supabase } from '~/lib/supabase/client';

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Estado inicial
const initialState: AuthState = {
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
};

// Store principal
export const authStore = atom<AuthState>(initialState);

// Actions
export const authActions = {
  // Inicializar autenticação
  initialize: async () => {
    try {
      authStore.set({ ...authStore.get(), isLoading: true });

      const user = await authHelpers.getCurrentUser();

      if (user) {
        const profile = await authHelpers.getUserProfile(user.id);

        authStore.set({
          user,
          profile,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        authStore.set({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      authStore.set({
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  },

  // Login
  signIn: async (email: string, password: string) => {
    try {
      authStore.set({ ...authStore.get(), isLoading: true });

      const { data, error } = await authHelpers.signIn(email, password);

      if (error) {
        authStore.set({ ...authStore.get(), isLoading: false });
        throw error;
      }

      if (data.user) {
        const user: AuthUser = {
          id: data.user.id,
          email: data.user.email!,
          created_at: data.user.created_at,
          last_sign_in_at: data.user.last_sign_in_at,
        };

        const profile = await authHelpers.getUserProfile(user.id);

        authStore.set({
          user,
          profile,
          isLoading: false,
          isAuthenticated: true,
        });

        return { data, error: null };
      }
    } catch (error) {
      authStore.set({ ...authStore.get(), isLoading: false });
      throw error;
    }

    return { data: null, error: new Error('Unexpected error in signIn') };
  },

  // Registro
  signUp: async (email: string, password: string) => {
    try {
      authStore.set({ ...authStore.get(), isLoading: true });

      const { data, error } = await authHelpers.signUp(email, password);

      if (error) {
        authStore.set({ ...authStore.get(), isLoading: false });
        throw error;
      }

      if (data.user) {
        const user: AuthUser = {
          id: data.user.id,
          email: data.user.email!,
          created_at: data.user.created_at,
          last_sign_in_at: data.user.last_sign_in_at,
        };

        /*
         * O perfil será criado automaticamente pelo trigger
         * Aguardar um pouco para o trigger processar
         */
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const profile = await authHelpers.getUserProfile(user.id);

        authStore.set({
          user,
          profile,
          isLoading: false,
          isAuthenticated: true,
        });

        return { data, error: null };
      }
    } catch (error) {
      authStore.set({ ...authStore.get(), isLoading: false });
      throw error;
    }

    return { data: null, error: new Error('Unexpected error in signUp') };
  },

  // Logout
  signOut: async () => {
    try {
      await authHelpers.signOut();

      // Limpar prompt pendente
      localStorage.removeItem('pendingPrompt');

      authStore.set({
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },

  // Atualizar perfil
  updateProfile: async (userId: string) => {
    try {
      const profile = await authHelpers.getUserProfile(userId);
      const currentState = authStore.get();

      authStore.set({
        ...currentState,
        profile,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  },
};

// Listener para mudanças de autenticação do Supabase
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event, session?.user?.email);

    if (event === 'SIGNED_IN' && session?.user) {
      const user: AuthUser = {
        id: session.user.id,
        email: session.user.email!,
        created_at: session.user.created_at,
        last_sign_in_at: session.user.last_sign_in_at,
      };

      const profile = await authHelpers.getUserProfile(user.id);

      authStore.set({
        user,
        profile,
        isLoading: false,
        isAuthenticated: true,
      });

      // Restaurar prompt pendente após login
      const pendingPrompt = localStorage.getItem('pendingPrompt');

      if (pendingPrompt) {
        console.log('Restaurando prompt pendente:', pendingPrompt);

        // O prompt será restaurado pelo componente de chat
      }
    } else if (event === 'SIGNED_OUT') {
      authStore.set({
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  });
}

// Hook para usar em componentes React
export const useAuth = () => {
  return authStore.get();
};
