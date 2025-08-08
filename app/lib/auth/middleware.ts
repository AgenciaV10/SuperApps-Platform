import { redirect } from '@remix-run/cloudflare';
import { getSupabaseClient, type AuthUser } from '~/lib/supabase/client';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('auth.middleware');

/**
 * Resultado da verificação de autenticação
 */
export interface AuthResult {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

/**
 * Opções para middleware de autenticação
 */
export interface AuthMiddlewareOptions {
  /** Se deve redirecionar para página de login quando não autenticado */
  redirectOnFail?: boolean;

  /** URL para redirecionar quando não autenticado */
  redirectTo?: string;

  /** Se deve permitir acesso sem autenticação (progressive enhancement) */
  allowUnauthenticated?: boolean;
}

/**
 * Middleware de autenticação flexível que suporta progressive enhancement
 *
 * @param request - Request do Remix
 * @param options - Opções de configuração
 * @returns Informações do usuário autenticado ou null
 */
export async function authMiddleware(request: Request, options: AuthMiddlewareOptions = {}): Promise<AuthResult> {
  const { redirectOnFail = false, redirectTo = '/auth', allowUnauthenticated = true } = options;

  try {
    logger.debug('Running auth middleware');

    // Extrair token de autenticação dos cookies
    const cookieHeader = request.headers.get('Cookie') || '';
    const authToken = extractAuthToken(cookieHeader);

    if (!authToken) {
      logger.debug('No auth token found');

      if (!allowUnauthenticated && redirectOnFail) {
        logger.info('Redirecting to auth page - no token');
        throw redirect(redirectTo);
      }

      return { user: null, isAuthenticated: false };
    }

    // Verificar token com Supabase
    const supabase = getSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(authToken);

    if (error || !user) {
      logger.debug('Invalid or expired token:', error?.message);

      if (!allowUnauthenticated && redirectOnFail) {
        logger.info('Redirecting to auth page - invalid token');
        throw redirect(redirectTo);
      }

      return { user: null, isAuthenticated: false };
    }

    logger.debug('User authenticated:', { userId: user.id, email: user.email });

    return { user, isAuthenticated: true };
  } catch (error) {
    // Se for um redirect, re-throw
    if (error instanceof Response) {
      throw error;
    }

    logger.error('Auth middleware error:', error);

    if (!allowUnauthenticated && redirectOnFail) {
      logger.info('Redirecting to auth page - middleware error');
      throw redirect(redirectTo);
    }

    return { user: null, isAuthenticated: false };
  }
}

/**
 * Middleware que requer autenticação obrigatória
 * Redireciona para login se não autenticado
 */
export async function requireAuth(request: Request, redirectTo = '/auth'): Promise<AuthUser> {
  logger.debug('Requiring authentication');

  const result = await authMiddleware(request, {
    redirectOnFail: true,
    redirectTo,
    allowUnauthenticated: false,
  });

  // TypeScript safety - se chegou aqui, usuário está autenticado
  if (!result.user) {
    logger.error('requireAuth failed - should have redirected');
    throw redirect(redirectTo);
  }

  return result.user;
}

/**
 * Middleware que permite acesso sem autenticação (progressive enhancement)
 * Usado para funcionalidades que funcionam com ou sem auth
 */
export async function optionalAuth(request: Request): Promise<AuthResult> {
  logger.debug('Running optional auth check');

  return authMiddleware(request, {
    allowUnauthenticated: true,
    redirectOnFail: false,
  });
}

/**
 * Verifica se o usuário está autenticado sem redirecionar
 * Útil para componentes condicionais
 */
export async function checkAuth(request: Request): Promise<AuthResult> {
  logger.debug('Checking auth status');

  return authMiddleware(request, {
    allowUnauthenticated: true,
    redirectOnFail: false,
  });
}

/**
 * Extrai token de autenticação dos cookies
 * Busca por diferentes formatos de cookie do Supabase
 */
function extractAuthToken(cookieHeader: string): string | null {
  try {
    const cookies = parseCookies(cookieHeader);

    // Tentar diferentes formatos de cookie do Supabase
    const tokenKeys = [
      'sb-access-token',
      'supabase-auth-token',
      'supabase.auth.token',
      'sb-jhvsuubkknhdrpwfjsrc-auth-token', // Formato específico do projeto
    ];

    for (const key of tokenKeys) {
      if (cookies[key]) {
        logger.debug(`Found auth token with key: ${key}`);
        return cookies[key];
      }
    }

    // Tentar extrair de cookies mais complexos do Supabase
    for (const [key, value] of Object.entries(cookies)) {
      if (key.includes('supabase') && key.includes('auth')) {
        try {
          // Tentar parsear como JSON se parecer ser um objeto
          if (value.startsWith('{') && value.endsWith('}')) {
            const parsed = JSON.parse(value);

            if (parsed.access_token) {
              logger.debug(`Found access token in JSON cookie: ${key}`);
              return parsed.access_token;
            }
          }
        } catch {
          // Ignorar erros de parsing
        }
      }
    }

    logger.debug('No auth token found in cookies');

    return null;
  } catch (error) {
    logger.error('Error extracting auth token:', error);
    return null;
  }
}

/**
 * Parser simples de cookies
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (!cookieHeader) {
    return cookies;
  }

  const items = cookieHeader.split(';').map((cookie) => cookie.trim());

  items.forEach((item) => {
    const [name, ...rest] = item.split('=');

    if (name && rest.length > 0) {
      try {
        const decodedName = decodeURIComponent(name.trim());
        const decodedValue = decodeURIComponent(rest.join('=').trim());
        cookies[decodedName] = decodedValue;
      } catch (error) {
        logger.debug(`Failed to decode cookie: ${name}`, error);
      }
    }
  });

  return cookies;
}

/**
 * Utilitário para proteger loaders do Remix
 */
export function createAuthLoader(
  loader: (args: any, user: AuthUser | null) => any,
  options: AuthMiddlewareOptions = {},
) {
  return async (args: any) => {
    const result = await authMiddleware(args.request, options);

    if (!result.isAuthenticated && !options.allowUnauthenticated) {
      throw redirect(options.redirectTo || '/auth');
    }

    return loader(args, result.user);
  };
}

/**
 * Utilitário para proteger actions do Remix
 */
export function createAuthAction(
  action: (args: any, user: AuthUser | null) => any,
  options: AuthMiddlewareOptions = {},
) {
  return async (args: any) => {
    const result = await authMiddleware(args.request, options);

    if (!result.isAuthenticated && !options.allowUnauthenticated) {
      throw redirect(options.redirectTo || '/auth');
    }

    return action(args, result.user);
  };
}
