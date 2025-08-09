import React, { useState, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { IconButton } from '~/components/ui/IconButton';
import { classNames } from '~/utils/classNames';
import type { ProviderInfo } from '~/types/model';
import { Dialog, DialogTitle, DialogDescription, DialogRoot, DialogClose } from '~/components/ui/Dialog';

export interface AgentMenuProps {
  provider: ProviderInfo | undefined;
  providerList: ProviderInfo[];
  model: string | undefined;
  modelList: any[];
  setProvider: (provider: ProviderInfo) => void;
  setModel: (model: string) => void;
  apiKeys: Record<string, string>;
  onApiKeysChange: (providerName: string, apiKey: string) => void;
  className?: string;
}

export const AgentMenu: React.FC<AgentMenuProps> = ({
  provider,
  providerList,
  model,
  modelList,
  setProvider,
  setModel,
  apiKeys,
  onApiKeysChange,
  className,
}) => {
  const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false);
  const [pendingKey, setPendingKey] = useState<string>('');

  // Sincronizar a API key atual quando o provider muda
  useEffect(() => {
    if (provider?.name && apiKeys[provider.name]) {
      setPendingKey(apiKeys[provider.name]);
    } else {
      setPendingKey('');
    }
  }, [provider, apiKeys]);

  const currentProviderName = provider?.name || 'Nenhum provider selecionado';

  const handleSaveKey = () => {
    if (provider?.name) {
      onApiKeysChange(provider.name, pendingKey);
    }
    setIsKeyDialogOpen(false);
  };

  // Converter modelList para strings se necessário
  const modelNames = modelList.map(m => typeof m === 'string' ? m : m.name || m.id || String(m));

  // Debug log para verificar se os modelos estão sendo carregados
  useEffect(() => {
    console.log('AgentMenu - Provider:', provider?.name);
    console.log('AgentMenu - Models:', modelNames);
    console.log('AgentMenu - Current model:', model);
  }, [provider, modelNames, model]);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          className={classNames(
            'flex items-center text-bolt-elements-item-contentDefault bg-transparent enabled:hover:text-bolt-elements-item-contentActive rounded-md p-1 enabled:hover:bg-bolt-elements-item-backgroundActive disabled:cursor-not-allowed focus:outline-none',
            className
          )}
          title={`Provider: ${provider?.name || 'None'} | Model: ${model || 'None'}`}
        >
          <div className="i-ph:robot text-xl" />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className={classNames(
              'min-w-[220px] rounded-lg p-2',
              'bg-bolt-elements-background-depth-2',
              'border border-bolt-elements-borderColor',
              'shadow-lg',
              'animate-in fade-in-80 zoom-in-95',
              'z-[99999] relative',
            )}
            sideOffset={5}
            align="start"
          >
            <div className="px-2 py-1 text-xs text-bolt-elements-textTertiary font-medium">Providers</div>
            {providerList && providerList.length > 0 ? (
              providerList.map((p) => (
                <DropdownMenu.Item
                  key={p.name}
                  className={classNames(
                    'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                    'text-bolt-elements-textPrimary hover:text-bolt-elements-textPrimary',
                    'hover:bg-bolt-elements-background-depth-3',
                    'transition-colors cursor-pointer',
                    'outline-none',
                    provider?.name === p.name ? 'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent' : ''
                  )}
                  onSelect={() => setProvider(p)}
                >
                  <div className="i-ph:cpu text-base" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{p.name}</span>
                    {provider?.name === p.name && <span className="text-xs opacity-75">Selecionado</span>}
                  </div>
                </DropdownMenu.Item>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-bolt-elements-textTertiary">Nenhum provider disponível</div>
            )}

            {modelNames.length > 0 && (
              <>
                <DropdownMenu.Separator className="h-px bg-bolt-elements-borderColor my-1" />
                <div className="px-2 py-1 text-xs text-bolt-elements-textTertiary font-medium">Modelos</div>
                {modelNames.slice(0, 8).map((m) => {
                  // Versões disponíveis para cada modelo
                  const modelVersions = [
                    { name: m, label: m, description: 'Versão Padrão', icon: 'i-ph:sparkle', color: 'text-blue-500' },
                    { name: `${m}-turbo`, label: `${m} Turbo`, description: 'Versão Rápida', icon: 'i-ph:lightning', color: 'text-yellow-500' },
                    { name: `${m}-precise`, label: `${m} Precise`, description: 'Versão Precisa', icon: 'i-ph:target', color: 'text-green-500' }
                  ];

                  return (
                    <React.Fragment key={`model-group-${m}`}>
                      {/* Cabeçalho do modelo */}
                      <div className="px-2 py-1 text-xs font-semibold text-bolt-elements-textSecondary bg-bolt-elements-background-depth-3 rounded-md mx-1 my-1">
                        {m}
                      </div>

                      {/* Versões do modelo */}
                      {modelVersions.map((version) => (
                        <DropdownMenu.Item
                          key={version.name}
                          className={classNames(
                            'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm ml-2',
                            'text-bolt-elements-textPrimary hover:text-bolt-elements-textPrimary',
                            'hover:bg-bolt-elements-background-depth-3',
                            'transition-colors cursor-pointer',
                            'outline-none focus:outline-none',
                            'data-[highlighted]:bg-bolt-elements-background-depth-3',
                            model === version.name ? 'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent' : ''
                          )}
                          onSelect={() => {
                            setModel(version.name);
                            console.log(`Selected: ${version.name}`);
                          }}
                        >
                          <div className={`${version.icon} text-base ${version.color}`} />
                          <div className="flex flex-col flex-1">
                            <span className="text-sm font-medium">{version.label}</span>
                            <span className="text-xs text-bolt-elements-textTertiary">{version.description}</span>
                          </div>
                          {model === version.name && <div className="i-ph:check text-xs" />}
                        </DropdownMenu.Item>
                      ))}
                    </React.Fragment>
                  );
                })}
                {modelNames.length > 8 && (
                  <div className="px-3 py-1 text-xs text-bolt-elements-textTertiary">
                    +{modelNames.length - 8} mais modelos
                  </div>
                )}
              </>
            )}

            <DropdownMenu.Separator className="h-px bg-bolt-elements-borderColor my-1" />
            <DropdownMenu.Item
              className={classNames(
                'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                'text-bolt-elements-textPrimary hover:text-bolt-elements-textPrimary',
                'hover:bg-bolt-elements-background-depth-3',
                'transition-colors cursor-pointer',
                'outline-none'
              )}
              onSelect={() => setIsKeyDialogOpen(true)}
            >
              <div className="i-ph:key text-base" />
              <div className="flex-1">
                <div className="text-sm font-medium">Configurar API Key</div>
                <div className="text-xs text-bolt-elements-textTertiary">
                  {provider?.name ? (apiKeys[provider.name] ? 'Configurada ✓' : 'Não configurada') : 'Selecione um provider'}
                </div>
              </div>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <DialogRoot open={isKeyDialogOpen} onOpenChange={setIsKeyDialogOpen}>
        <Dialog>
          <div className="p-6">
            <DialogTitle>Configurar API Key</DialogTitle>
            <DialogDescription className="mb-4">
              Configure a API Key para <strong>{currentProviderName}</strong>
            </DialogDescription>
            <input
              type="password"
              className="w-full px-3 py-2 rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary"
              placeholder="Digite sua API key..."
              value={pendingKey}
              onChange={(e) => setPendingKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pendingKey.trim()) {
                  handleSaveKey();
                }
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <DialogClose asChild>
                <button className="px-4 py-2 rounded-md text-sm bg-bolt-elements-button-secondary-background hover:bg-bolt-elements-button-secondary-backgroundHover text-bolt-elements-button-secondary-text">
                  Cancelar
                </button>
              </DialogClose>
              <button
                className="px-4 py-2 rounded-md text-sm text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundImage: 'var(--bolt-elements-gradient-primary)' }}
                onClick={handleSaveKey}
                disabled={!provider || !pendingKey.trim()}
              >
                Salvar
              </button>
            </div>
          </div>
        </Dialog>
      </DialogRoot>
    </>
  );
};
