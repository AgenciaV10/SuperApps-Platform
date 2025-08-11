import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useCallback, useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { db, getAll, type ChatHistoryItem, useChatHistory } from '~/lib/persistence';
import { classNames } from '~/utils/classNames';
import { profileStore } from '~/lib/stores/profile';

export function HeaderMenu() {
  const profile = useStore(profileStore);
  const { exportChat, duplicateCurrentChat } = useChatHistory();
  const [list, setList] = useState<ChatHistoryItem[]>([]);
  const [query, setQuery] = useState('');

  const loadEntries = useCallback(() => {
    if (!db) return;
    getAll(db)
      .then((items) => items.filter((item) => item.urlId && item.description))
      .then(setList)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const filtered = query
    ? list.filter((i) => i.description.toLowerCase().includes(query.toLowerCase()))
    : list;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className={classNames(
              'px-4 h-9 rounded-full flex items-center gap-2',
              // Light: manter fundo escuro p/ contraste; Dark: mantém escuro
              'bg-black text-white font-medium',
              // Bordas por tema para não sumir
              'border border-black/50 dark:border-white/10',
              // Hover por tema: não clarear no light
              'hover:bg-black/80 dark:hover:bg-white/10 transition-colors',
            )}
            title="Meus Projetos"
          >
            <span className="i-ph:folders text-base" />
            <span className="text-sm font-medium">Meus Projetos</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          className={classNames(
            'min-w-[320px] max-w-[420px] rounded-lg p-2',
            'bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor shadow-lg',
            'z-[99999] relative max-h-[420px] overflow-y-auto',
          )}
          sideOffset={6}
          align="start"
        >
          <div className="px-2 py-1.5 flex items-center gap-2">
            <div className="i-ph:user-circle text-base text-bolt-elements-textSecondary" />
            <div className="text-xs text-bolt-elements-textTertiary truncate">
              {profile?.username || 'Convidado'}
            </div>
          </div>
          <div className="px-2">
            <a
              href="/"
              className={classNames(
                'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/20',
              )}
            >
              <span className="i-ph:plus-circle text-base" />
              <span>Novo projeto</span>
            </a>
          </div>

          <div className="px-2 py-2">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 i-ph:magnifying-glass text-sm text-bolt-elements-textTertiary" />
              <input
                className="w-full bg-bolt-elements-background-depth-3 pl-9 pr-3 py-2 rounded-md text-sm border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary"
                placeholder="Buscar projetos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="px-2 py-1 text-xs text-bolt-elements-textTertiary font-medium">Projetos</div>
          <div className="px-1 pb-1 space-y-0.5">
            {filtered.length === 0 && (
              <div className="px-3 py-6 text-sm text-bolt-elements-textSecondary">Nenhum projeto encontrado</div>
            )}
            {filtered.map((item) => (
              <DropdownMenu.Item key={item.id} asChild>
                <a
                  href={`/chat/${item.urlId}`}
                  className={classNames(
                    'group flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                    'text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3',
                  )}
                >
                  <span className="i-ph:file-text text-base text-bolt-elements-textSecondary" />
                  <span className="flex-1 truncate">{item.description}</span>
                  <button
                    className="i-ph:copy text-sm text-bolt-elements-textTertiary opacity-0 group-hover:opacity-100 hover:text-bolt-elements-textSecondary"
                    title="Duplicar"
                    onClick={(e) => {
                      e.preventDefault();
                      duplicateCurrentChat(item.id);
                    }}
                  />
                  <button
                    className="i-ph:download-simple text-sm text-bolt-elements-textTertiary opacity-0 group-hover:opacity-100 hover:text-bolt-elements-textSecondary"
                    title="Exportar"
                    onClick={(e) => {
                      e.preventDefault();
                      exportChat(item.id);
                    }}
                  />
                </a>
              </DropdownMenu.Item>
            ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
}


