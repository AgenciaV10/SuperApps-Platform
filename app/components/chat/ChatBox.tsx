import React from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { classNames } from '~/utils/classNames';
import FilePreview from './FilePreview';
import { ScreenshotStateManager } from './ScreenshotStateManager';
import { SendButton } from './SendButton.client';
import { IconButton } from '~/components/ui/IconButton';
import { toast } from 'react-toastify';
import { SpeechRecognitionButton } from '~/components/chat/SpeechRecognition';
import { SupabaseConnection } from './SupabaseConnection';
import { ExpoQrModal } from '~/components/workbench/ExpoQrModal';
import styles from './BaseChat.module.scss';
import type { ProviderInfo } from '~/types/model';
import type { DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';
import { AgentMenu } from './AgentMenu';
import { ModelSettingsMenu } from './ModelSettingsMenu';

export interface ChatBoxProps {
  isModelSettingsCollapsed: boolean;
  setIsModelSettingsCollapsed: (collapsed: boolean) => void;
  provider: any;
  providerList: any[];
  modelList: any[];
  apiKeys: Record<string, string>;
  isModelLoading: string | undefined;
  onApiKeysChange: (providerName: string, apiKey: string) => void;
  uploadedFiles: File[];
  imageDataList: string[];
  textareaRef: React.RefObject<HTMLTextAreaElement> | undefined;
  input: string;
  handlePaste: (e: React.ClipboardEvent) => void;
  TEXTAREA_MIN_HEIGHT: number;
  TEXTAREA_MAX_HEIGHT: number;
  isStreaming: boolean;
  handleSendMessage: (event: React.UIEvent, messageInput?: string) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  chatStarted: boolean;
  exportChat?: () => void;
  qrModalOpen: boolean;
  setQrModalOpen: (open: boolean) => void;
  handleFileUpload: () => void;
  setProvider?: ((provider: ProviderInfo) => void) | undefined;
  model?: string | undefined;
  setModel?: ((model: string) => void) | undefined;
  setUploadedFiles?: ((files: File[]) => void) | undefined;
  setImageDataList?: ((dataList: string[]) => void) | undefined;
  handleInputChange?: ((event: React.ChangeEvent<HTMLTextAreaElement>) => void) | undefined;
  handleStop?: (() => void) | undefined;
  enhancingPrompt?: boolean | undefined;
  enhancePrompt?: (() => void) | undefined;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
  selectedElement?: ElementInfo | null;
  setSelectedElement?: ((element: ElementInfo | null) => void) | undefined;
}

export const ChatBox: React.FC<ChatBoxProps> = (props) => {
  return (
    <div className="relative w-full max-w-chat mx-auto z-prompt">
      {/* ModelSelector/APIKeyManager removidos: gerenciamento via AgentMenu + ModelSettingsMenu */}
      <FilePreview
        files={props.uploadedFiles}
        imageDataList={props.imageDataList}
        onRemove={(index) => {
          props.setUploadedFiles?.(props.uploadedFiles.filter((_, i) => i !== index));
          props.setImageDataList?.(props.imageDataList.filter((_, i) => i !== index));
        }}
      />
      <ClientOnly>
        {() => (
          <ScreenshotStateManager
            setUploadedFiles={props.setUploadedFiles}
            setImageDataList={props.setImageDataList}
            uploadedFiles={props.uploadedFiles}
            imageDataList={props.imageDataList}
          />
        )}
      </ClientOnly>
      {props.selectedElement && (
        <div className="flex mx-1.5 gap-2 items-center justify-between rounded-lg rounded-b-none border border-b-none border-bolt-elements-borderColor text-bolt-elements-textPrimary flex py-1 px-2.5 font-medium text-xs">
          <div className="flex gap-2 items-center lowercase">
            <code className="bg-accent-500 rounded-4px px-1.5 py-1 mr-0.5 text-white">
              {props?.selectedElement?.tagName}
            </code>
            selected for inspection
          </div>
          <button
            className="bg-transparent text-accent-500 pointer-auto"
            onClick={() => props.setSelectedElement?.(null)}
          >
            Clear
          </button>
        </div>
      )}
      {/* Container principal seguindo estrutura do Lovable */}
      <div className="w-full max-w-3xl">
        <div className="relative w-full">
          <div className="flex w-full flex-col items-center">
            <div className="relative size-full">
              <form className="group flex flex-col gap-2 p-3 w-full rounded-3xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-base shadow-xl transition-all duration-150 ease-in-out focus-within:border-gray-400 dark:focus-within:border-gray-500 hover:border-gray-400 dark:hover:border-gray-500">

                {/* Área do textarea */}
                <div className="relative flex flex-1 items-center">
                  <textarea
                    ref={props.textareaRef}
                    className="flex w-full rounded-md px-2 py-2 ring-offset-background placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-[16px] leading-snug placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap md:text-base max-h-[200px] bg-transparent focus:bg-transparent flex-1 text-gray-900 dark:text-gray-100"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        if (event.shiftKey) {
                          return;
                        }

                        event.preventDefault();

                        if (props.isStreaming) {
                          props.handleStop?.();
                          return;
                        }

                        if (event.nativeEvent.isComposing) {
                          return;
                        }

                        props.handleSendMessage?.(event);
                      }
                    }}
                    value={props.input}
                    onChange={(event) => {
                      props.handleInputChange?.(event);
                    }}
                    onPaste={props.handlePaste}
                    style={{
                      minHeight: '80px',
                      height: '80px',
                    }}
                    placeholder="Peça a SuperApps para criar um projeto"
                    maxLength={50000}
                    translate="no"
                  />
                </div>

                {/* Container dos botões - seguindo exatamente a estrutura do Lovable */}
                <div className="flex gap-1 flex-wrap items-center">

                  {/* 1. Botão Microfone (no lugar do +) */}
                  <button
                    type="button"
                    className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 gap-1.5 h-8 w-8 rounded-full p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    onClick={props.isListening ? props.stopListening : props.startListening}
                    disabled={props.isStreaming}
                    title="Reconhecimento de voz"
                  >
                    <div className={`i-ph:microphone text-base ${props.isListening ? 'text-red-500' : ''}`}></div>
                  </button>

                  {/* 2. Botão Anexar */}
                  <button
                    type="button"
                    className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 py-2 h-8 gap-1.5 rounded-full px-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    onClick={() => props.handleFileUpload()}
                    title="Anexar arquivo"
                  >
                    <div className="i-ph:paperclip text-base"></div>
                    <span className="hidden md:flex">Anexar</span>
                  </button>

                  {/* 3. Botão Configurações (no lugar de Público) */}
                  <button
                    type="button"
                    className="whitespace-nowrap text-sm font-medium transition-colors duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-gray-400 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 px-3 py-2 flex h-8 items-center justify-center gap-1 rounded-full text-gray-600 dark:text-gray-400 focus-visible:ring-0"
                    onClick={() => props.setIsModelSettingsCollapsed(!props.isModelSettingsCollapsed)}
                    title="Configurações"
                  >
                    <div className="flex items-center gap-1 duration-200">
                      <div className="i-ph:gear text-base"></div>
                      <span className="hidden md:flex">Configurações</span>
                    </div>
                  </button>

                  {/* 4. Botão Supabase */}
                  <SupabaseConnection />

                  {/* Lado direito - Provider IA e Enviar */}
                  <div className="ml-auto flex items-center gap-1">
                    <div className="relative flex items-center gap-1 md:gap-2">

                      {/* 5. Provider IA (no lugar de GPT-5) */}
                      {props.providerList?.length ? (
                        <AgentMenu
                          provider={props.provider as any}
                          providerList={(props.providerList as any[]) || []}
                          model={props.model as any}
                          modelList={(props.modelList as any[]) || []}
                          setProvider={props.setProvider as any}
                          setModel={props.setModel as any}
                          apiKeys={props.apiKeys}
                          onApiKeysChange={props.onApiKeysChange}
                          className="lovable-provider-button"
                        />
                      ) : null}

                      {/* 6. Botão de Envio */}
                      <button
                        type="submit"
                        className={classNames(
                          "flex h-8 w-8 items-center justify-center rounded-full transition-opacity duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50",
                          props.input.length > 0 || props.uploadedFiles.length > 0
                            ? "bg-gray-900 dark:bg-gray-100"
                            : "bg-gray-400 dark:bg-gray-600"
                        )}
                        disabled={
                          !props.providerList ||
                          props.providerList.length === 0 ||
                          (!props.isStreaming && props.input.length === 0 && props.uploadedFiles.length === 0)
                        }
                        onClick={(event) => {
                          event.preventDefault();
                          if (props.isStreaming) {
                            props.handleStop?.();
                            return;
                          }

                          if (props.input.length > 0 || props.uploadedFiles.length > 0) {
                            props.handleSendMessage?.(event);
                          }
                        }}
                      >
                        <div className="i-ph:arrow-up text-lg text-white dark:text-gray-900"></div>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="h-[40px]"></div>
          </div>
        </div>
      </div>

      {/* Componentes ocultos para funcionalidades extras */}
      <div className="hidden">
        <ExpoQrModal open={props.qrModalOpen} onClose={() => props.setQrModalOpen(false)} />
      </div>
    </div>
  );
};
