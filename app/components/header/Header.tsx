import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { HeaderMenu } from './HeaderMenu.client';

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames(
        'flex items-center h-[var(--header-height)] px-6 md:px-8',
        // light: subtle texture; dark: same base tone
        'bg-white dark:bg-[#0c0c0e]',
        'bg-[radial-gradient(1200px_400px_at_50%_-200px,rgba(0,0,0,0.04),transparent_60%)] dark:bg-[radial-gradient(1200px_400px_at_50%_-200px,rgba(255,255,255,0.06),transparent_60%)]',
        'border-b border-black/10 dark:border-black/40',
      )}
    >
      <div className="flex items-center gap-2 md:gap-3 z-logo text-bolt-elements-textPrimary">
        <a href="/" className="text-2xl font-semibold text-accent flex items-center">
          {/* <span className="i-bolt:logo-text?mask w-[46px] inline-block" /> */}
          <img src="/logo-light-styled.png" alt="logo" className="w-[74px] md:w-[90px] inline-block dark:hidden" />
          <img src="/logo-dark-styled.png" alt="logo" className="w-[74px] md:w-[90px] inline-block hidden dark:block" />
        </a>
      </div>
      {/* Navegação central fixa conforme design */}
      <nav className="hidden md:flex items-center gap-10 mx-auto text-gray-800 dark:text-white/90">
        <a href="#" className="text-sm hover:text-black dark:hover:text-white transition-colors">Comunidade</a>
        <a href="#" className="text-sm hover:text-black dark:hover:text-white transition-colors">Preços</a>
        <a href="#" className="text-sm hover:text-black dark:hover:text-white transition-colors">Parceria</a>
        <a href="#" className="text-sm hover:text-black dark:hover:text-white transition-colors">Aprender</a>
      </nav>
      {chat.started && (
        <span className="sr-only">
          <ClientOnly>{() => <ChatDescription />}</ClientOnly>
        </span>
      )}
      <div className="flex items-center gap-2 md:gap-3 ml-auto">
        <ClientOnly>{() => <HeaderMenu />}</ClientOnly>
        <ClientOnly>{() => <HeaderRight />}</ClientOnly>
      </div>
    </header>
  );
}

function HeaderRight() {
  return (
    <div className="flex items-center gap-2">
      <ThemeToggler />
      <UserMenu />
    </div>
  );
}

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import { toggleTheme } from '~/lib/stores/theme';
import { useUserProfile } from '~/lib/hooks/useUserProfile';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '~/lib/supabase/client';
import { ControlPanel } from '~/components/@settings/core/ControlPanel';
import { AuthScreen } from '~/components/auth/AuthScreen';

function ThemeToggler() {
  return (
    <div className="h-9 flex items-center">
      <ModernThemeSwitch />
    </div>
  );
}

function UserMenu() {
  const { isAuthenticated, loading, displayName, email, avatarUrl, initials, signOut } = useUserProfile();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [planName, setPlanName] = useState<string>('');
  const [planLoading, setPlanLoading] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!isAuthenticated || !isOpen || planName) return;
      try {
        setPlanLoading(true);
        const supabase = getSupabaseClient();
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id;
        if (!userId) return;
        const { data: row } = await supabase.from('users').select('plan_id').eq('id', userId).maybeSingle();
        const normalized = String((row as any)?.plan_id || '').toLowerCase();
        let label = 'Free';
        if (normalized.includes('pro')) label = 'Pro';
        if (normalized.includes('enterprise') || normalized.includes('empresa')) label = 'Empresas';
        setPlanName(label);
      } finally {
        setPlanLoading(false);
      }
    };
    fetchPlan();
  }, [isAuthenticated, isOpen, planName]);

  return (
    <>
      <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            className="flex items-center gap-2 h-9 md:h-10 px-1.5 md:pl-2 md:pr-3 rounded-full text-white border border-white/10 hover:brightness-110"
            style={{ backgroundImage: 'var(--bolt-elements-gradient-primary)', opacity: 1, transform: 'none' }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName || 'User'} className="h-8 w-8 md:h-7 md:w-7 rounded-full object-cover" />
            ) : (
              <span className="flex items-center justify-center h-8 w-8 md:h-7 md:w-7 rounded-full bg-white/20 font-bold">{initials}</span>
            )}
            <span className="hidden md:inline text-sm font-medium">{isAuthenticated ? displayName || email || 'Usuário' : 'Login/Cadastro'}</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content className="min-w-[280px] rounded-lg p-2 bg-white text-gray-900 dark:bg-bolt-elements-background-depth-2 dark:text-bolt-elements-textPrimary border border-black/10 dark:border-bolt-elements-borderColor shadow-xl z-[99999]">
          {isAuthenticated ? (
            <>
              <div className="px-3 py-2 flex items-center gap-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName || 'User'} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center font-semibold">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{displayName || 'Usuário'}</div>
                  {email && <div className="text-xs text-gray-500 dark:text-bolt-elements-textTertiary truncate">{email}</div>}
                </div>
              </div>

              <div className="px-3 py-2">
                <div className="text-xs text-gray-500 dark:text-bolt-elements-textTertiary mb-1">Plano</div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5">
                    {planLoading ? 'Carregando…' : planName || 'Free'}
                  </span>
                  <a href="#" className="text-xs text-bolt-elements-item-contentAccent hover:underline">Gerenciar plano</a>
                  <a href="#" className="ml-auto text-xs text-bolt-elements-item-contentAccent hover:underline">Histórico de pagamentos</a>
                </div>
              </div>
              <DropdownMenu.Separator className="h-px bg-bolt-elements-borderColor my-1" />
              <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-bolt-elements-background-depth-3 cursor-pointer" onSelect={() => setIsSettingsOpen(true)}>
                <span className="i-ph:gear-six text-base" />
                <span>Editar perfil e preferências</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-bolt-elements-background-depth-3 cursor-pointer" onSelect={() => signOut()}>
                <span className="i-ph:sign-out text-base" />
                <span>Sair</span>
              </DropdownMenu.Item>
            </>
          ) : (
            <DropdownMenu.Item
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-bolt-elements-background-depth-3 cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                setIsOpen(false);
                setIsAuthOpen(true);
              }}
            >
              <span className="i-ph:sign-in text-base" />
              <span>Login/Cadastro</span>
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <ControlPanel open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ClientOnly>
        {() =>
          isAuthOpen ? (
            <AuthScreen mode="modal" onClose={() => setIsAuthOpen(false)} onAuthSuccess={() => setIsAuthOpen(false)} />
          ) : null
        }
      </ClientOnly>
    </>
  );
}
function ModernThemeSwitch() {
  return (
    <button
      onClick={() => toggleTheme()}
      className="relative inline-flex h-7 w-12 md:h-8 md:w-16 items-center rounded-full bg-black/10 dark:bg-white/10 border border-black/15 dark:border-white/15 hover:brightness-110 transition-colors overflow-hidden"
      aria-label="Alternar tema"
      type="button"
    >
      {/* logos dos modos */}
      <span className="absolute left-1.5 md:left-2 flex items-center gap-1 text-[10px] md:text-xs text-gray-700 dark:hidden">
        <span className="i-ph:moon-stars-duotone" />
        <span>Dark</span>
      </span>
      <span className="absolute right-1.5 md:right-2 hidden dark:flex items-center gap-1 text-[10px] md:text-xs text-yellow-300">
        <span className="i-ph:sun-dim-duotone" />
        <span>Light</span>
      </span>
      <span className="pointer-events-none inline-block h-5 w-5 md:h-6 md:w-6 translate-x-1 rounded-full bg-white shadow-md transition-transform dark:translate-x-7 md:dark:translate-x-8" />
    </button>
  );
}
