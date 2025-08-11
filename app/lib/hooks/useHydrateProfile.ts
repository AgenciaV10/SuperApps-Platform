import { useEffect } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { updateProfile } from '~/lib/stores/profile';

/**
 * Hidrata o profileStore com dados reais do usuário
 * Fontes (ordem de precedência):
 * - localStorage 'bolt_user_profile' (quando existir)
 * - Supabase user.user_metadata (name, avatar_url, bio)
 * - Fallback: parte antes do @ do email
 */
export function useHydrateProfile() {
  const { user, loading } = useSupabaseAuth();

  useEffect(() => {
    if (loading) return;

    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('bolt_user_profile') : null;
      const parsed = stored ? JSON.parse(stored) : {};

      const nameFromLocal = parsed?.name || parsed?.username;
      const avatarFromLocal = parsed?.avatar;
      const bioFromLocal = parsed?.bio;

      const meta: any = user?.user_metadata || {};
      const nameFromMeta = meta?.name || meta?.full_name || meta?.nickname;
      const avatarFromMeta = meta?.avatar_url || meta?.picture;
      const bioFromMeta = meta?.bio;

      const email = user?.email || '';
      const fallbackName = email ? email.split('@')[0] : '';

      const username = nameFromLocal || nameFromMeta || fallbackName || '';
      const avatar = avatarFromLocal || avatarFromMeta || '';
      const bio = bioFromLocal || bioFromMeta || '';

      // Atualiza somente se houver algo significativo
      if (username || avatar || bio) {
        updateProfile({ username, avatar, bio });
      }
    } catch (e) {
      // silencioso
      console.warn('useHydrateProfile: falha ao hidratar perfil', e);
    }
  }, [user, loading]);
}


