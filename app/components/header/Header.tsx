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
      <div className="flex items-center gap-3 z-logo text-bolt-elements-textPrimary">
        <a href="/" className="text-2xl font-semibold text-accent flex items-center">
          {/* <span className="i-bolt:logo-text?mask w-[46px] inline-block" /> */}
          <img src="/logo-light-styled.png" alt="logo" className="w-[90px] inline-block dark:hidden" />
          <img src="/logo-dark-styled.png" alt="logo" className="w-[90px] inline-block hidden dark:block" />
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
      <div className="flex items-center gap-3 ml-auto">
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
import { useStore as useNanoStore } from '@nanostores/react';
import { profileStore as userProfileStore } from '~/lib/stores/profile';
import { useState } from 'react';
import { ControlPanel } from '~/components/@settings/core/ControlPanel';

function ThemeToggler() {
  return (
    <div className="h-9 flex items-center">
      <ModernThemeSwitch />
    </div>
  );
}

function UserMenu() {
  const profile = useNanoStore(userProfileStore);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const username = profile?.username || 'Usuário';

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center gap-2 h-10 pl-2 pr-3 rounded-full text-white border border-white/10 hover:brightness-110" style={{ backgroundImage: 'var(--bolt-elements-gradient-primary)', opacity: 1, transform: 'none' }}>
            <span className="flex items-center justify-center h-7 w-7 rounded-full bg-white/20 font-bold">{username.charAt(0)}</span>
            <span className="text-sm font-medium">{username}</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content className="min-w-[240px] rounded-lg p-2 bg-white text-gray-900 dark:bg-bolt-elements-background-depth-2 dark:text-bolt-elements-textPrimary border border-black/10 dark:border-bolt-elements-borderColor shadow-xl z-[99999]">
          <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-bolt-elements-background-depth-3 cursor-pointer" onSelect={() => setIsSettingsOpen(true)}>
            <span className="i-ph:gear-six text-base" />
            <span>Configurações</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-bolt-elements-background-depth-3 cursor-pointer" asChild>
            <a href="/">Sair</a>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <ControlPanel open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
function ModernThemeSwitch() {
  return (
    <button
      onClick={() => toggleTheme()}
      className="relative inline-flex h-8 w-14 items-center rounded-full bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/15 hover:brightness-110 transition-colors"
      aria-label="Alternar tema"
      type="button"
    >
      <span className="absolute left-1 i-ph:moon-stars-duotone text-gray-700 dark:hidden" />
      <span className="absolute right-1 i-ph:sun-dim-duotone text-yellow-300 hidden dark:inline" />
      <span className="pointer-events-none inline-block h-6 w-6 translate-x-1 rounded-full bg-white shadow-md transition-transform dark:translate-x-7" />
    </button>
  );
}
