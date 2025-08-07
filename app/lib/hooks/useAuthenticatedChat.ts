import { useEffect, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { useStore } from '@nanostores/react';
import { authStore, authActions } from '~/lib/stores/auth';
import { authHelpers } from '~/lib/supabase/client';

export const useAuthenticatedChat = () => {
  const navigate = useNavigate();
  const auth = useStore(authStore);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  // Inicializar autenticação quando o componente montar
  useEffect(() => {
    authActions.initialize();
  }, []);

  // Interceptar envio de mensagem para verificar autenticação
  const interceptSendMessage = async (
    originalSendMessage: (event: React.UIEvent, messageInput?: string) => Promise<void>,
    event: React.UIEvent,
    messageInput?: string,
  ) => {
    setIsCheckingAuth(true);

    try {
      // Verificar se está autenticado
      const isAuthenticated = await authHelpers.isAuthenticated();

      if (!isAuthenticated) {
        // Salvar prompt no localStorage
        const promptToSave = messageInput || '';

        if (promptToSave.trim()) {
          localStorage.setItem('pendingPrompt', promptToSave);
          console.log('Prompt salvo para restaurar após login:', promptToSave);
        }

        // Redirecionar para login
        navigate('/auth/login');

        return;
      }

      // Se autenticado, prosseguir com envio normal
      await originalSendMessage(event, messageInput);
    } catch (error) {
      console.error('Error in interceptSendMessage:', error);

      // Em caso de erro, salvar prompt e redirecionar para login
      const promptToSave = messageInput || '';

      if (promptToSave.trim()) {
        localStorage.setItem('pendingPrompt', promptToSave);
      }

      navigate('/auth/login');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Restaurar prompt pendente após login
  const restorePendingPrompt = (): string | null => {
    if (auth.isAuthenticated) {
      const pendingPrompt = localStorage.getItem('pendingPrompt');

      if (pendingPrompt) {
        localStorage.removeItem('pendingPrompt');
        console.log('Prompt restaurado após login:', pendingPrompt);

        return pendingPrompt;
      }
    }

    return null;
  };

  // Verificar se usuário está autenticado para mostrar informações
  const shouldShowAuthPrompt = () => {
    return !auth.isAuthenticated && !auth.isLoading;
  };

  // Obter informações do usuário para exibir
  const getUserInfo = () => {
    if (auth.isAuthenticated && auth.profile) {
      return {
        email: auth.user?.email,
        budget: auth.profile.budget_remaining,
        dailyUsage: auth.profile.daily_usage,
        requestsToday: auth.profile.request_count_today,
      };
    }

    return null;
  };

  return {
    auth,
    isCheckingAuth,
    interceptSendMessage,
    restorePendingPrompt,
    shouldShowAuthPrompt,
    getUserInfo,
  };
};
