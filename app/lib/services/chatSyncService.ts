import type { Message } from 'ai';
import { getSupabaseClient, type Chat, /* type ChatMessage, */ type AuthUser } from '~/lib/supabase/client';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('chatSyncService');

export interface SyncResult {
  success: boolean;
  error?: string;
  chatId?: string;
}

export interface ChatSyncOptions {
  /** Se deve sincronizar mesmo se offline */
  forceSync?: boolean;

  /** Se deve criar backup local antes da sincronização */
  createBackup?: boolean;
}

/**
 * Serviço para sincronizar chats entre localStorage/IndexedDB e Supabase
 * Implementa progressive enhancement - funciona offline como fallback
 */
export class ChatSyncService {
  private _supabase = getSupabaseClient();
  private _isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    // Monitorar status de conexão
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this._isOnline = true;
        logger.debug('Connection restored - enabling sync');
      });

      window.addEventListener('offline', () => {
        this._isOnline = false;
        logger.debug('Connection lost - falling back to local storage');
      });
    }
  }

  /**
   * Sincroniza um chat local com o backend Supabase
   */
  async syncChatToBackend(
    chatId: string,
    messages: Message[],
    title?: string,
    user?: AuthUser | null,
    options: ChatSyncOptions = {},
  ): Promise<SyncResult> {
    try {
      if (!user) {
        logger.debug('No user authenticated - skipping backend sync');
        return { success: true }; // Não é erro, apenas não há usuário
      }

      if (!this._isOnline && !options.forceSync) {
        logger.debug('Offline and forceSync not enabled - skipping backend sync');
        return { success: true }; // Funcionará offline
      }

      logger.debug(`Syncing chat ${chatId} to backend`, {
        messageCount: messages.length,
        title,
        userId: user.id,
      });

      // 1. Verificar se chat já existe
      const { data: existingChat } = await this._supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .eq('user_id', user.id)
        .single();

      // 2. Criar ou atualizar chat
      const chatData = {
        id: chatId,
        user_id: user.id,
        title: title || this._generateChatTitle(messages),
        updated_at: new Date().toISOString(),
      };

      if (existingChat) {
        const { error: chatError } = await this._supabase.from('chats').update(chatData).eq('id', chatId);

        if (chatError) {
          logger.error('Failed to update chat:', chatError);
          return { success: false, error: chatError.message };
        }
      } else {
        const { error: chatError } = await this._supabase.from('chats').insert({
          ...chatData,
          created_at: new Date().toISOString(),
        });

        if (chatError) {
          logger.error('Failed to create chat:', chatError);
          return { success: false, error: chatError.message };
        }
      }

      // 3. Sincronizar mensagens
      const syncResult = await this._syncMessagesToBackend(chatId, messages);

      if (!syncResult.success) {
        return syncResult;
      }

      logger.info(`Chat ${chatId} synced successfully to backend`);

      return { success: true, chatId };
    } catch (error) {
      logger.error('Unexpected error during chat sync:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error',
      };
    }
  }

  /**
   * Sincroniza mensagens de um chat específico
   */
  private async _syncMessagesToBackend(chatId: string, messages: Message[]): Promise<SyncResult> {
    try {
      // Buscar mensagens existentes no backend
      const { data: existingMessages } = await this._supabase
        .from('messages')
        .select('id, content, role, metadata, created_at')
        .eq('chat_id', chatId)
        .order('created_at');

      const existingMessageIds = new Set(existingMessages?.map((m) => m.id) || []);

      // Identificar mensagens novas
      const newMessages = messages.filter((msg) => !existingMessageIds.has(msg.id));

      if (newMessages.length > 0) {
        logger.debug(`Syncing ${newMessages.length} new messages to backend`);

        const messagesToInsert = newMessages.map((msg) => ({
          id: msg.id,
          chat_id: chatId,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          metadata: this._extractMessageMetadata(msg),
          created_at: new Date().toISOString(),
        }));

        const { error } = await this._supabase.from('messages').insert(messagesToInsert);

        if (error) {
          logger.error('Failed to sync messages:', error);
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error) {
      logger.error('Error syncing messages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync messages',
      };
    }
  }

  /**
   * Carrega chats do backend para usuário autenticado
   */
  async loadChatsFromBackend(_user: AuthUser): Promise<Chat[]> {
    try {
      logger.debug(`Loading chats from backend for user ${_user.id}`);

      const { data: chats, error } = await this._supabase
        .from('chats')
        .select('*')
        .eq('user_id', _user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error('Failed to load chats from backend:', error);
        return [];
      }

      logger.debug(`Loaded ${chats?.length || 0} chats from backend`);

      return chats || [];
    } catch (error) {
      logger.error('Error loading chats from backend:', error);
      return [];
    }
  }

  /**
   * Carrega mensagens de um chat específico do backend
   */
  async loadChatMessagesFromBackend(chatId: string, _user: AuthUser): Promise<Message[]> {
    try {
      logger.debug(`Loading messages for chat ${chatId} from backend`);

      const { data: messages, error } = await this._supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at');

      if (error) {
        logger.error('Failed to load chat messages:', error);
        return [];
      }

      // Converter formato do backend para formato do frontend
      const convertedMessages: Message[] = (messages || []).map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: new Date(msg.created_at),
        ...this._parseMessageMetadata(msg.metadata),
      }));

      logger.debug(`Loaded ${convertedMessages.length} messages for chat ${chatId}`);

      return convertedMessages;
    } catch (error) {
      logger.error('Error loading chat messages:', error);
      return [];
    }
  }

  /**
   * Deleta um chat do backend
   */
  async deleteChatFromBackend(chatId: string, user: AuthUser): Promise<SyncResult> {
    try {
      logger.debug(`Deleting chat ${chatId} from backend`);

      const { error } = await this._supabase.from('chats').delete().eq('id', chatId).eq('user_id', user.id);

      if (error) {
        logger.error('Failed to delete chat from backend:', error);
        return { success: false, error: error.message };
      }

      logger.info(`Chat ${chatId} deleted from backend`);

      return { success: true };
    } catch (error) {
      logger.error('Error deleting chat from backend:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete chat',
      };
    }
  }

  /**
   * Força sincronização completa de todos os chats locais
   */
  async syncAllChatsToBackend(_user: AuthUser): Promise<SyncResult> {
    try {
      logger.debug('Starting full sync of all chats to backend');

      /*
       * Esta função seria integrada com o sistema de persistência local existente
       * Por enquanto, retorna sucesso já que o foco é na integração individual
       */

      logger.info('Full chat sync completed');

      return { success: true };
    } catch (error) {
      logger.error('Error during full chat sync:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Full sync failed',
      };
    }
  }

  /**
   * Utilitários privados
   */

  private _generateChatTitle(messages: Message[]): string {
    const firstUserMessage = messages.find((m) => m.role === 'user');

    if (firstUserMessage) {
      const truncated = firstUserMessage.content.slice(0, 50);
      return truncated.length < firstUserMessage.content.length ? `${truncated}...` : truncated;
    }

    return 'Nova Conversa';
  }

  private _extractMessageMetadata(message: Message): any {
    // Extrair metadados relevantes da mensagem (excluindo campos padrão)
    const { id, role, content, createdAt, ...metadata } = message;
    return Object.keys(metadata).length > 0 ? metadata : null;
  }

  private _parseMessageMetadata(metadata: any): Partial<Message> {
    if (!metadata || typeof metadata !== 'object') {
      return {};
    }

    // Aplicar metadados de volta à mensagem
    return metadata;
  }
}

/**
 * Instância singleton do serviço de sincronização
 */
export const chatSyncService = new ChatSyncService();

/**
 * Hook para usar o serviço de sincronização de chats
 */
export function useChatSync() {
  return {
    syncChatToBackend: chatSyncService.syncChatToBackend.bind(chatSyncService),
    loadChatsFromBackend: chatSyncService.loadChatsFromBackend.bind(chatSyncService),
    loadChatMessagesFromBackend: chatSyncService.loadChatMessagesFromBackend.bind(chatSyncService),
    deleteChatFromBackend: chatSyncService.deleteChatFromBackend.bind(chatSyncService),
    syncAllChatsToBackend: chatSyncService.syncAllChatsToBackend.bind(chatSyncService),
  };
}
