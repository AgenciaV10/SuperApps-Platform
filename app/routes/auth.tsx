import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { useEffect } from 'react';
import { AuthScreen } from '~/components/auth/AuthScreen';
import { checkAuth } from '~/lib/auth/middleware';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('auth.route');

export const meta: MetaFunction = () => {
  return [
    { title: 'Autenticação - Bolt.diy' },
    { name: 'description', content: 'Faça login ou cadastre-se para usar o Bolt.diy' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    logger.debug('Auth route loader called');
    
    // Verificar se usuário já está autenticado
    const authResult = await checkAuth(request);
    
    if (authResult.isAuthenticated && authResult.user) {
      logger.info('User already authenticated, redirecting to home');
      throw redirect('/');
    }
    
    // Extrair parâmetros da URL
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('redirectTo') || '/';
    const preservedPrompt = url.searchParams.get('prompt') || undefined;
    
    return json({
      redirectTo,
      preservedPrompt,
    });
  } catch (error) {
    // Se for um redirect, re-throw
    if (error instanceof Response) {
      throw error;
    }
    
    logger.error('Auth route loader error:', error);
    
    // Em caso de erro, ainda mostrar a tela de auth
    return json({
      redirectTo: '/',
      preservedPrompt: undefined,
    });
  }
}

export default function AuthRoute() {
  const { redirectTo, preservedPrompt } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  
  const handleAuthSuccess = () => {
    logger.info('Auth successful, redirecting to:', redirectTo);
    navigate(redirectTo, { replace: true });
  };
  
  return (
    <div className="min-h-screen bg-bolt-elements-background-depth-1">
      <AuthScreen
        mode="fullscreen"
        onAuthSuccess={handleAuthSuccess}
        preservedPrompt={preservedPrompt}
        showCloseButton={false}
      />
    </div>
  );
}