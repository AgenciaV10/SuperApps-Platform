import React, { useState, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { IconButton } from '~/components/ui/IconButton';
import { classNames } from '~/utils/classNames';
import type { ProviderInfo } from '~/types/model';
import { Dialog, DialogTitle, DialogDescription, DialogRoot, DialogClose } from '~/components/ui/Dialog';
import styles from './BaseChat.module.scss';

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
  const [viewMode, setViewMode] = useState<'providers' | 'models'>('providers');

  // Sincronizar a API key atual quando o provider muda
  useEffect(() => {
    if (provider?.name && apiKeys[provider.name]) {
      setPendingKey(apiKeys[provider.name]);
    } else {
      setPendingKey('');
    }
  }, [provider, apiKeys]);

  // Quando um provider é selecionado, mostrar seus modelos
  const handleProviderSelect = (selectedProvider: ProviderInfo) => {
    setProvider(selectedProvider);
    setViewMode('models');
  };

  // Voltar para a tela anterior
  const handleBack = () => {
    if (viewMode === 'models') {
      setViewMode('providers');
    }
  };

  const currentProviderName = provider?.name || 'Nenhum provider selecionado';

  const handleSaveKey = () => {
    if (provider?.name) {
      onApiKeysChange(provider.name, pendingKey);
    }
    setIsKeyDialogOpen(false);
  };

  // Filtrar modelos do provider atual
  const currentProviderModels = modelList.filter(m => {
    const modelProvider = typeof m === 'string' ? '' : (m.provider || '');
    return modelProvider === provider?.name;
  });

  // Converter modelList para strings se necessário
  const modelNames = currentProviderModels.map(m => typeof m === 'string' ? m : m.name || m.id || String(m));

    // Função para obter versões de um modelo (usando os modelos reais disponíveis)
  const getModelVersions = (baseModel: string) => {
    // Para Google Gemini, usar os modelos reais do provider
    if (provider?.name === 'Google' && baseModel.includes('gemini')) {
      const geminiModels = currentProviderModels.filter(m => {
        const modelName = typeof m === 'string' ? m : m.name;
        return modelName.toLowerCase().includes('gemini');
      });

      return geminiModels.map(m => {
        const modelInfo = typeof m === 'string' ? { name: m, label: m } : m;
        let icon = 'i-ph:sparkle';
        let color = 'text-blue-500';
        let description = 'Modelo Gemini';

        if (modelInfo.name.includes('flash')) {
          icon = 'i-ph:lightning';
          color = 'text-yellow-500';
          description = 'Versão Flash - Rápida';
        } else if (modelInfo.name.includes('pro')) {
          icon = 'i-ph:crown';
          color = 'text-purple-500';
          description = 'Versão Pro - Potente';
        } else if (modelInfo.name.includes('thinking')) {
          icon = 'i-ph:brain';
          color = 'text-green-500';
          description = 'Versão Thinking - Reflexiva';
        }

        return {
          name: modelInfo.name,
          label: modelInfo.label || modelInfo.name,
          description,
          icon,
          color
        };
      });
    }

    // Para Anthropic Claude, mostrar modelos reais disponíveis
    if (provider?.name === 'Anthropic' && baseModel.toLowerCase().includes('claude')) {
      const claudeModels = currentProviderModels.filter(m => {
        const modelName = typeof m === 'string' ? m : m.name;
        return modelName.toLowerCase().includes('claude');
      });

      return claudeModels.map(m => {
        const modelInfo = typeof m === 'string' ? { name: m, label: m } : m;
        let icon = 'i-ph:sparkle';
        let color = 'text-blue-500';
        let description = 'Modelo Claude';

        if (modelInfo.name.includes('haiku')) {
          icon = 'i-ph:feather';
          color = 'text-cyan-500';
          description = 'Versão Haiku - Leve';
        } else if (modelInfo.name.includes('sonnet')) {
          icon = 'i-ph:scales';
          color = 'text-indigo-500';
          description = 'Versão Sonnet - Balanceada';
        } else if (modelInfo.name.includes('opus')) {
          icon = 'i-ph:crown';
          color = 'text-yellow-500';
          description = 'Versão Opus - Mais Potente';
        }

        return {
          name: modelInfo.name,
          label: modelInfo.label || modelInfo.name,
          description,
          icon,
          color
        };
      });
    }

    // Para outros providers, mostrar os modelos reais disponíveis
    const relatedModels = currentProviderModels.filter(m => {
      const modelName = typeof m === 'string' ? m : m.name;
      return modelName.toLowerCase().includes(baseModel.toLowerCase()) || modelName === baseModel;
    });

    if (relatedModels.length > 0) {
      return relatedModels.map(m => {
        const modelInfo = typeof m === 'string' ? { name: m, label: m } : m;
        return {
          name: modelInfo.name,
          label: modelInfo.label || modelInfo.name,
          description: `Modelo ${provider?.name || 'Disponível'}`,
          icon: 'i-ph:sparkle',
          color: 'text-blue-500'
        };
      });
    }

    // Fallback: retornar o modelo base
    return [
      {
        name: baseModel,
        label: baseModel,
        description: 'Modelo Base',
        icon: 'i-ph:sparkle',
        color: 'text-blue-500'
      }
    ];
  };



  // Debug log para verificar estado atual
  useEffect(() => {
    console.log('=== AgentMenu Debug ===');
    console.log('View Mode:', viewMode);
    console.log('Provider:', provider?.name);
    console.log('Provider Models:', currentProviderModels);
    console.log('Model Names:', modelNames);
    console.log('Current model:', model);
    console.log('=====================');
  }, [viewMode, provider, currentProviderModels, modelNames, model]);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          className={classNames(
            'flex items-center text-bolt-elements-item-contentDefault bg-transparent enabled:hover:text-bolt-elements-item-contentActive rounded-md p-1 enabled:hover:bg-bolt-elements-item-backgroundActive disabled:cursor-not-allowed focus:outline-none',
            className
          )}
          title={`${provider?.name || 'Nenhum Provider'} → ${model || 'Nenhum Modelo'}`}
        >
          <div className="i-ph:robot text-xl" />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                  className={classNames(
                    'min-w-[220px] max-w-[280px] rounded-lg p-2',
                    'bg-bolt-elements-background-depth-2',
                    'border border-bolt-elements-borderColor',
                    'shadow-lg',
                    'animate-in fade-in-80 zoom-in-95',
                    'z-[99999] relative',
                    'max-h-[400px] overflow-y-auto',
                    // Aplicar scrollbar customizada
                    styles.AgentMenuScrollbar,
                  )}
                  sideOffset={5}
                  align="start"
                >
            {/* Header com navegação */}
            <div className="flex items-center gap-2 px-2 py-1 mb-2">
              {viewMode !== 'providers' && (
                <button
                  onClick={handleBack}
                  className="i-ph:arrow-left text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                  title="Voltar"
                />
              )}
              <div className="text-xs text-bolt-elements-textTertiary font-medium flex-1">
                {viewMode === 'providers' && 'Providers'}
                {viewMode === 'models' && `${provider?.name} - Modelos`}
              </div>
            </div>

            {/* Visualização de Providers */}
            {viewMode === 'providers' && (
              <>
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
                          onSelect={(event) => {
                            event.preventDefault(); // Evitar que o menu feche
                            handleProviderSelect(p);
                          }}
                        >
                      <div className="i-ph:cpu text-base" />
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-medium">{p.name}</span>
                        {provider?.name === p.name && <span className="text-xs opacity-75">Selecionado</span>}
                      </div>
                      <div className="i-ph:caret-right text-xs" />
                      {provider?.name === p.name && viewMode === 'providers' && (
                        <div className="i-ph:check text-xs text-green-500 ml-1" />
                      )}
                    </DropdownMenu.Item>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-bolt-elements-textTertiary">Nenhum provider disponível</div>
                )}
              </>
            )}

            {/* Visualização de Modelos */}
            {viewMode === 'models' && (
              <>
                {currentProviderModels.length === 0 && (
                  <div className="px-3 py-4 text-center">
                    <div className="i-ph:info text-2xl text-bolt-elements-textTertiary mb-2" />
                    <div className="text-sm text-bolt-elements-textSecondary">
                      Nenhum modelo disponível para {provider?.name}
                    </div>
                    <div className="text-xs text-bolt-elements-textTertiary mt-1">
                      Configure a API key ou verifique a conexão
                    </div>
                  </div>
                )}
                {currentProviderModels.length > 0 && (
              <>
                {currentProviderModels.map((m) => {
                  const modelInfo = typeof m === 'string' ? { name: m, label: m } : m;
                  let icon = 'i-ph:brain';
                  let color = 'text-blue-500';
                  let description = '';

                  // Ícones e descrições específicas baseadas no nome do modelo
                  if (modelInfo.name.includes('flash')) {
                    icon = 'i-ph:lightning';
                    color = 'text-yellow-500';
                    description = 'Rápido e eficiente';
                  } else if (modelInfo.name.includes('pro')) {
                    icon = 'i-ph:crown';
                    color = 'text-purple-500';
                    description = 'Versão profissional';
                  } else if (modelInfo.name.includes('haiku')) {
                    icon = 'i-ph:feather';
                    color = 'text-cyan-500';
                    description = 'Leve e rápido';
                  } else if (modelInfo.name.includes('sonnet')) {
                    icon = 'i-ph:scales';
                    color = 'text-indigo-500';
                    description = 'Balanceado';
                  } else if (modelInfo.name.includes('opus')) {
                    icon = 'i-ph:crown';
                    color = 'text-yellow-500';
                    description = 'Mais potente';
                  } else if (modelInfo.name.includes('thinking')) {
                    icon = 'i-ph:brain';
                    color = 'text-green-500';
                    description = 'Versão reflexiva';
                  }

                  return (
                    <DropdownMenu.Item
                      key={modelInfo.name}
                      className={classNames(
                        'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                        'text-bolt-elements-textPrimary hover:text-bolt-elements-textPrimary',
                        'hover:bg-bolt-elements-background-depth-3',
                        'transition-colors cursor-pointer',
                        'outline-none focus:outline-none',
                        'data-[highlighted]:bg-bolt-elements-background-depth-3',
                        model === modelInfo.name ? 'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent' : ''
                      )}
                      onSelect={() => {
                        setModel(modelInfo.name);
                        setViewMode('providers'); // Voltar para providers após seleção
                        console.log(`Selected model: ${modelInfo.name}`);
                        // O menu fechará automaticamente após a seleção do modelo
                      }}
                    >
                      <div className={`${icon} text-base ${color}`} />
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-medium">{modelInfo.label || modelInfo.name}</span>
                        {description && <span className="text-xs text-bolt-elements-textTertiary">{description}</span>}
                      </div>
                      {model === modelInfo.name && <div className="i-ph:check text-xs" />}
                    </DropdownMenu.Item>
                  );
                })}
              </>
                )}
              </>
            )}



            {/* Seção API Key (apenas na tela de providers) */}
            {viewMode === 'providers' && (
              <>
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
              </>
            )}
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
