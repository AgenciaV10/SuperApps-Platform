import React, { useState, useEffect } from 'react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { IconButton } from '~/components/ui/IconButton';
import { useSupabaseAuth } from '~/lib/hooks/useSupabaseAuth';
import { createScopedLogger } from '~/utils/logger';
import { toast } from 'react-toastify';

const logger = createScopedLogger('AuthScreen');

export interface AuthScreenProps {
  /** Se a tela deve ser exibida como modal ou página completa */
  mode?: 'modal' | 'fullscreen';

  /** Callback chamado quando a autenticação é bem-sucedida */
  onAuthSuccess?: () => void;

  /** Callback para fechar a tela (apenas para modo modal) */
  onClose?: () => void;

  /** Prompt que foi preservado e deve ser reexibido após auth */
  preservedPrompt?: string;

  /** Se deve mostrar o botão de fechar */
  showCloseButton?: boolean;
}

type AuthMode = 'signin' | 'signup' | 'forgot-password';

/**
 * Componente de autenticação com suporte a login/cadastro
 * Implementa progressive enhancement - pode ser usado como modal ou página completa
 */
export function AuthScreen({
  mode = 'modal',
  onAuthSuccess,
  onClose,
  preservedPrompt,
  showCloseButton = true,
}: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, loading, error, signIn, signUp, resetPassword, clearError } = useSupabaseAuth();

  // Se usuário já está autenticado, chamar callback de sucesso
  useEffect(() => {
    if (user && !loading) {
      logger.info('User already authenticated, calling success callback');
      onAuthSuccess?.();
    }
  }, [user, loading, onAuthSuccess]);

  // Limpar erro quando trocar de modo
  useEffect(() => {
    clearError();
  }, [authMode, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    // Validações básicas
    if (!email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    if (authMode !== 'forgot-password' && !password) {
      toast.error('Senha é obrigatória');
      return;
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      toast.error('Senhas não coincidem');
      return;
    }

    if (authMode === 'signup' && password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsSubmitting(true);

    try {
      let result;

      switch (authMode) {
        case 'signin':
          logger.debug('Attempting sign in');
          result = await signIn(email, password);
          break;

        case 'signup':
          logger.debug('Attempting sign up');
          result = await signUp(email, password);
          break;

        case 'forgot-password':
          logger.debug('Attempting password reset');
          result = await resetPassword(email);
          break;
      }

      if (result?.success) {
        if (authMode === 'signup') {
          toast.success('Conta criada! Verifique seu email para confirmar.');
          setAuthMode('signin');
        } else if (authMode === 'forgot-password') {
          toast.success('Email de recuperação enviado!');
          setAuthMode('signin');
        } else {
          toast.success('Login realizado com sucesso!');
          onAuthSuccess?.();
        }
      } else if (result?.error) {
        toast.error(result.error);
      }
    } catch (error) {
      logger.error('Auth form submission error:', error);
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    clearError();
  };

  const switchMode = (newMode: AuthMode) => {
    setAuthMode(newMode);
    resetForm();
  };

  if (loading) {
    return (
      <div className={getContainerClasses(mode)}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bolt-elements-borderColor"></div>
          <span className="ml-2 text-bolt-elements-textSecondary">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={getContainerClasses(mode)}>
      <div className="relative max-w-md w-full space-y-8 p-6 bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor">
        {/* Botão de fechar (apenas para modal) */}
        {mode === 'modal' && showCloseButton && onClose && (
          <IconButton
            title="Fechar"
            className="absolute top-4 right-4 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
            onClick={onClose}
          >
            <div className="i-ph:x text-xl"></div>
          </IconButton>
        )}

        {/* Header */}
        <div className="text-center">
          <div className="mb-4">
            {/* Logo do projeto */}
            <img
              src="/logo%20ico.png"
              alt="Logo"
              className="mx-auto h-12 w-auto object-contain"
              loading="eager"
              decoding="async"
            />
          </div>
          <h2 className="text-2xl font-bold text-bolt-elements-textPrimary">{getTitle(authMode)}</h2>
          {preservedPrompt && (
            <p className="mt-2 text-sm text-bolt-elements-textSecondary">
              Faça login para continuar com: "{truncateText(preservedPrompt, 60)}"
            </p>
          )}
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="w-full"
              autoComplete="email"
              required
            />
          </div>

          {authMode !== 'forgot-password' && (
            <div>
              <Input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full"
                autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                required
              />
            </div>
          )}

          {authMode === 'signup' && (
            <div>
              <Input
                type="password"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full"
                autoComplete="new-password"
                required
              />
            </div>
          )}

          {/* Exibir erro se houver */}
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded">{error}</div>
          )}

          <Button
            type="submit"
            style={{ backgroundImage: 'var(--bolt-elements-gradient-primary)' }}
            className="w-full text-white hover:brightness-110 focus-visible:ring-0 border-none"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {getSubmitButtonText(authMode, true)}
              </div>
            ) : (
              getSubmitButtonText(authMode, false)
            )}
          </Button>
        </form>

        {/* Links de navegação */}
        <div className="text-center space-y-2">
          {authMode === 'signin' && (
            <>
              <button
                type="button"
                onClick={() => switchMode('forgot-password')}
                className="text-sm text-bolt-elements-item-contentAccent hover:underline bg-transparent hover:bg-transparent focus:outline-none focus:ring-0"
                disabled={isSubmitting}
              >
                Esqueceu sua senha?
              </button>
              <div className="pt-2">
                <span className="text-sm text-bolt-elements-textSecondary">Não tem conta? </span>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-sm text-bolt-elements-item-contentAccent hover:underline bg-transparent hover:bg-transparent focus:outline-none focus:ring-0"
                  disabled={isSubmitting}
                >
                  Cadastre-se
                </button>
              </div>
            </>
          )}

          {authMode === 'signup' && (
            <div>
              <span className="text-sm text-bolt-elements-textSecondary">Já tem conta? </span>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-sm text-bolt-elements-item-contentAccent hover:underline bg-transparent hover:bg-transparent focus:outline-none focus:ring-0"
                disabled={isSubmitting}
              >
                Entrar
              </button>
            </div>
          )}

          {authMode === 'forgot-password' && (
            <div>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-sm text-bolt-elements-item-contentAccent hover:underline bg-transparent hover:bg-transparent focus:outline-none focus:ring-0"
                disabled={isSubmitting}
              >
                ← Voltar ao login
              </button>
            </div>
          )}
        </div>

        {/* Footer com informações */}
        <div className="text-center text-xs text-bolt-elements-textTertiary">
          <p>
            Ao criar uma conta, você concorda com nossos{' '}
            <span className="text-bolt-elements-item-contentAccent">Termos de Uso</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper functions
 */

function getContainerClasses(mode: 'modal' | 'fullscreen'): string {
  const baseClasses = 'flex items-center justify-center p-4';

  if (mode === 'modal') {
    return `${baseClasses} fixed inset-0 bg-black/50 backdrop-blur-sm z-50`;
  }

  return `${baseClasses} min-h-screen bg-bolt-elements-background-depth-1`;
}

function getTitle(authMode: AuthMode): string {
  switch (authMode) {
    case 'signin':
      return 'Entrar na sua conta';
    case 'signup':
      return 'Criar nova conta';
    case 'forgot-password':
      return 'Recuperar senha';
    default:
      return 'Autenticação';
  }
}

function getSubmitButtonText(authMode: AuthMode, isLoading: boolean): string {
  if (isLoading) {
    switch (authMode) {
      case 'signin':
        return 'Entrando...';
      case 'signup':
        return 'Criando conta...';
      case 'forgot-password':
        return 'Enviando...';
      default:
        return 'Processando...';
    }
  }

  switch (authMode) {
    case 'signin':
      return 'Entrar';
    case 'signup':
      return 'Criar conta';
    case 'forgot-password':
      return 'Enviar email';
    default:
      return 'Continuar';
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + '...';
}
