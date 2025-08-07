import { redirect, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useEffect } from 'react';
import { authHelpers } from '~/lib/supabase/client';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (code) {
    try {
      /*
       * O Supabase vai processar o código OAuth automaticamente
       * Verificamos se o usuário está autenticado
       */
      const isAuth = await authHelpers.isAuthenticated();

      if (isAuth) {
        // Login OAuth bem-sucedido, redireciona para home
        return redirect('/');
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
    }
  }

  // Se falhou, redireciona para login com erro
  return redirect('/auth/login?error=oauth_failed');
}

export default function AuthCallback() {
  useEffect(() => {
    /*
     * Este componente geralmente não será renderizado
     * pois o loader redireciona antes disso
     */
    console.log('Processing OAuth callback...');
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processando login...</p>
      </div>
    </div>
  );
}
