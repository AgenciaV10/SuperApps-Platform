import React, { useState, useEffect, useCallback } from 'react';
import { ChatBox, type ChatBoxProps } from './ChatBox';
import { AuthScreen } from '~/components/auth/AuthScreen';
import { useSupabaseAuth } from '~/lib/hooks/useSupabaseAuth';
import { createScopedLogger } from '~/utils/logger';
import { toast } from 'react-toastify';

const logger = createScopedLogger('AuthenticatedChatBox');

type AuthenticatedChatBoxProps = ChatBoxProps & {
  /** Se deve exigir autenticação antes de enviar mensagens */
  requireAuth?: boolean;

  /** Callback para quando uma mensagem é enviada (após autenticação se necessário) */
  onMessageSent?: (message: string) => void;
};

const PRESERVED_PROMPT_KEY = 'bolt_preserved_prompt';

/**
 * Wrapper do ChatBox que adiciona autenticação progressiva
 * Preserva o prompt digitado e exibe tela de login quando necessário
 */
export function AuthenticatedChatBox({
  requireAuth = true,
  onMessageSent,
  handleSendMessage: originalHandleSendMessage,
  ...chatBoxProps
}: AuthenticatedChatBoxProps) {
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [preservedPrompt, setPreservedPrompt] = useState<string>('');
  const [shouldSendAfterAuth, setShouldSendAfterAuth] = useState(false);

  const { user, loading: authLoading } = useSupabaseAuth();

  // Restaurar prompt preservado ao carregar
  useEffect(() => {
    const stored = localStorage.getItem(PRESERVED_PROMPT_KEY);

    if (stored) {
      logger.debug('Restoring preserved prompt from localStorage');
      setPreservedPrompt(stored);
      localStorage.removeItem(PRESERVED_PROMPT_KEY);
    }
  }, []);

  // Auto-enviar prompt após autenticação bem-sucedida
  useEffect(() => {
    if (user && shouldSendAfterAuth && preservedPrompt) {
      logger.debug('User authenticated, sending preserved prompt');

      // Pequeno delay para garantir que a UI foi atualizada
      setTimeout(() => {
        if (originalHandleSendMessage) {
          // Criar evento simulado
          const syntheticEvent = new Event('submit') as any;
          originalHandleSendMessage(syntheticEvent, preservedPrompt);

          // Notificar callback se fornecido
          onMessageSent?.(preservedPrompt);

          // Limpar estados
          setPreservedPrompt('');
          setShouldSendAfterAuth(false);

          toast.success('Prompt enviado após autenticação!');
        }
      }, 100);
    }
  }, [user, shouldSendAfterAuth, preservedPrompt, originalHandleSendMessage, onMessageSent]);

  // Quando existir um prompt preservado mas não estamos no fluxo de autenticação,
  // propagar o valor para o input controlado do Chat e limpar o estado local para permitir edição.
  useEffect(() => {
    if (preservedPrompt && !showAuthScreen && !shouldSendAfterAuth) {
      const syntheticEvent = { target: { value: preservedPrompt } } as React.ChangeEvent<HTMLTextAreaElement>;
      chatBoxProps.handleInputChange?.(syntheticEvent);
      setPreservedPrompt('');
    }
  }, [preservedPrompt, showAuthScreen, shouldSendAfterAuth, chatBoxProps.handleInputChange]);

  // Handler personalizado que verifica autenticação
  const handleSendMessage = useCallback(
    (event: React.UIEvent, messageInput?: string) => {
      const messageContent = messageInput || chatBoxProps.input;

      if (!messageContent?.trim()) {
        logger.debug('Empty message, calling original handler');
        originalHandleSendMessage?.(event, messageInput);

        return;
      }

      // Se autenticação não é obrigatória, enviar diretamente
      if (!requireAuth) {
        logger.debug('Auth not required, sending message directly');
        originalHandleSendMessage?.(event, messageInput);
        onMessageSent?.(messageContent);

        return;
      }

      // Se usuário já está autenticado, enviar normalmente
      if (user && !authLoading) {
        logger.debug('User authenticated, sending message');
        originalHandleSendMessage?.(event, messageInput);
        onMessageSent?.(messageContent);

        /*
         * Opcional: sincronizar com backend se implementado
         * Aqui você pode adicionar lógica para sincronizar mensagens
         */
        return;
      }

      // Se não autenticado, preservar prompt e mostrar tela de login
      logger.debug('User not authenticated, preserving prompt and showing auth screen');

      // Preservar o prompt
      setPreservedPrompt(messageContent);
      localStorage.setItem(PRESERVED_PROMPT_KEY, messageContent);
      setShouldSendAfterAuth(true);

      // Mostrar tela de autenticação
      setShowAuthScreen(true);

      // Prevenir o envio original
      event.preventDefault();
      event.stopPropagation();
    },
    [requireAuth, user, authLoading, chatBoxProps.input, originalHandleSendMessage, onMessageSent],
  );

  // Handler para sucesso da autenticação
  const handleAuthSuccess = useCallback(() => {
    logger.debug('Authentication successful, closing auth screen');
    setShowAuthScreen(false);

    // O useEffect acima vai cuidar do auto-envio
    toast.success('Login realizado com sucesso!');
  }, []);

  // Handler para fechar a tela de auth (sem autenticar)
  const handleAuthClose = useCallback(() => {
    logger.debug('Auth screen closed without authentication');
    setShowAuthScreen(false);

    /*
     * Manter o prompt preservado caso o usuário queira tentar novamente
     * mas limpar o flag de auto-envio
     */
    setShouldSendAfterAuth(false);
  }, []);

  // Se carregando estado de auth, mostrar loading
  if (authLoading) {
    return (
      <div className="relative bg-bolt-elements-background-depth-2 backdrop-blur p-3 rounded-lg border border-bolt-elements-borderColor relative w-full max-w-[130%] mx-auto z-prompt">
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-bolt-elements-borderColor mr-2"></div>
          <span className="text-bolt-elements-textSecondary">Verificando autenticação...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/**
       * Apenas sobrepõe o valor do input com o preservedPrompt enquanto a tela de autenticação
       * estiver aberta. Fora desse contexto, usamos o input controlado normal (editável).
       */}
      <ChatBox
        {...chatBoxProps}
        handleSendMessage={handleSendMessage}
        input={showAuthScreen ? preservedPrompt || chatBoxProps.input : chatBoxProps.input}
      />

      {/* Tela de autenticação modal */}
      {showAuthScreen && (
        <AuthScreen
          mode="modal"
          onAuthSuccess={handleAuthSuccess}
          onClose={handleAuthClose}
          preservedPrompt={preservedPrompt}
          showCloseButton={true}
        />
      )}
    </>
  );
}

/**
 * Hook para usar autenticação com ChatBox
 * Facilita a integração em componentes existentes
 */
export function useChatBoxAuth(requireAuth = true) {
  const { user, loading } = useSupabaseAuth();
  const [preservedPrompt, setPreservedPrompt] = useState<string>('');

  const preservePrompt = useCallback((prompt: string) => {
    setPreservedPrompt(prompt);
    localStorage.setItem(PRESERVED_PROMPT_KEY, prompt);
  }, []);

  const clearPreservedPrompt = useCallback(() => {
    setPreservedPrompt('');
    localStorage.removeItem(PRESERVED_PROMPT_KEY);
  }, []);

  const isAuthRequired = useCallback(
    (messageContent: string) => {
      return requireAuth && messageContent.trim() && !user && !loading;
    },
    [requireAuth, user, loading],
  );

  return {
    user,
    loading,
    preservedPrompt,
    preservePrompt,
    clearPreservedPrompt,
    isAuthRequired,
    isAuthenticated: !!user && !loading,
  };
}
