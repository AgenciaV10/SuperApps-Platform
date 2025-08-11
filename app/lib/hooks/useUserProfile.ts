import { useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { profileStore } from '~/lib/stores/profile';
import { useSupabaseAuth } from './useSupabaseAuth';

export interface UserProfileView {
  isAuthenticated: boolean;
  loading: boolean;
  displayName: string;
  email: string;
  avatarUrl?: string;
  initials: string;
  signOut: () => Promise<void>;
}

export function useUserProfile(): UserProfileView {
  const profile = useStore(profileStore);
  const { user, loading, signOut } = useSupabaseAuth();

  const email = user?.email || '';
  const displayName = useMemo(() => {
    if (profile?.username && profile.username.trim().length > 0) return profile.username.trim();
    const metaName = (user?.user_metadata as any)?.name as string | undefined;
    if (metaName && metaName.trim().length > 0) return metaName.trim();
    if (email) return email.split('@')[0];
    return '';
  }, [profile?.username, user?.user_metadata, email]);

  const avatarUrl = useMemo(() => {
    const fromProfile = profile?.avatar && profile.avatar.trim().length > 0 ? profile.avatar.trim() : undefined;
    const fromMeta = (user?.user_metadata as any)?.avatar_url as string | undefined;
    return fromProfile || fromMeta || undefined;
  }, [profile?.avatar, user?.user_metadata]);

  const initials = useMemo(() => {
    const source = displayName || email || 'U';
    return source.charAt(0).toUpperCase();
  }, [displayName, email]);

  return {
    isAuthenticated: Boolean(user),
    loading,
    displayName,
    email,
    avatarUrl,
    initials,
    signOut,
  };
}


