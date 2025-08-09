import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { IconButton } from '~/components/ui/IconButton';
import { classNames } from '~/utils/classNames';
import { ColorSchemeDialog } from '~/components/ui/ColorSchemeDialog';
import { McpTools } from './MCPTools';
import type { DesignScheme } from '~/types/design-scheme';

export interface ModelSettingsMenuProps {
  onTogglePanel: () => void;
  canEnhance: boolean;
  onEnhance: () => void;
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
  className?: string;
  enhancingPrompt?: boolean;
}

export const ModelSettingsMenu: React.FC<ModelSettingsMenuProps> = ({
  onTogglePanel,
  canEnhance,
  onEnhance,
  designScheme,
  setDesignScheme,
  className,
  enhancingPrompt = false,
}) => {

  const handleEnhance = () => {
    if (canEnhance && !enhancingPrompt) {
      onEnhance();
    }
  };

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          className={classNames(
            'flex items-center text-bolt-elements-item-contentDefault bg-transparent enabled:hover:text-bolt-elements-item-contentActive rounded-md p-1 enabled:hover:bg-bolt-elements-item-backgroundActive disabled:cursor-not-allowed focus:outline-none',
            className
          )}
          title="Configurações e ferramentas"
        >
          <div className="i-ph:gear text-xl" />
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
            <div className="px-2 py-1 text-xs text-bolt-elements-textTertiary font-medium">Configurações</div>
            <DropdownMenu.Item
              className={classNames(
                'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                'text-bolt-elements-textPrimary hover:text-bolt-elements-textPrimary',
                'hover:bg-bolt-elements-background-depth-3',
                'transition-colors cursor-pointer',
                'outline-none'
              )}
              onSelect={onTogglePanel}
            >
              <div className="i-ph:sidebar text-base" />
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium">Painel de Configurações</span>
                <span className="text-xs text-bolt-elements-textTertiary">Mostrar/ocultar configurações do modelo</span>
              </div>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="h-px bg-bolt-elements-borderColor my-1" />
            <div className="px-2 py-1 text-xs text-bolt-elements-textTertiary font-medium">Ferramentas</div>

            <DropdownMenu.Item
              className={classNames(
                'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                'text-bolt-elements-textPrimary hover:text-bolt-elements-textPrimary',
                'hover:bg-bolt-elements-background-depth-3',
                'transition-colors cursor-pointer',
                'outline-none',
                !canEnhance ? 'opacity-50 cursor-not-allowed' : ''
              )}
              onSelect={canEnhance ? handleEnhance : undefined}
              disabled={!canEnhance}
            >
              <div className={`text-base ${enhancingPrompt ? 'i-svg-spinners:90-ring-with-bg animate-spin' : 'i-bolt:stars'}`} />
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium">Enhance Prompt</span>
                <span className="text-xs text-bolt-elements-textTertiary">
                  {enhancingPrompt ? 'Processando...' : canEnhance ? 'Melhorar o prompt atual' : 'Digite algo para ativar'}
                </span>
              </div>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="h-px bg-bolt-elements-borderColor my-1" />
            <div className="px-2 py-1 text-xs text-bolt-elements-textTertiary font-medium">Personalizações</div>

            <div className="px-3 py-2 flex items-center gap-2">
              <div className="i-ph:palette text-base" />
              <div className="flex-1">
                <ColorSchemeDialog designScheme={designScheme} setDesignScheme={setDesignScheme} />
              </div>
            </div>

            <div className="px-3 py-2 flex items-center gap-2">
              <div className="i-bolt:mcp text-base" />
              <div className="flex-1">
                <McpTools />
              </div>
            </div>

            <DropdownMenu.Separator className="h-px bg-bolt-elements-borderColor my-1" />
            <div className="px-2 py-1 text-xs text-bolt-elements-textTertiary font-medium">Informações</div>
            <DropdownMenu.Item
              className={classNames(
                'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                'text-bolt-elements-textPrimary hover:text-bolt-elements-textPrimary',
                'hover:bg-bolt-elements-background-depth-3',
                'transition-colors cursor-pointer',
                'outline-none'
              )}
              onSelect={() => {}}
            >
              <div className="i-ph:info text-base" />
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium">Sobre</span>
                <span className="text-xs text-bolt-elements-textTertiary">Versão e informações do sistema</span>
              </div>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </>
  );
};
