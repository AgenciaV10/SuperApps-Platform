import { getSupabaseClient } from '~/lib/supabase/client';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('workspaceSyncService');

export type SnapshotFile = { path: string; content: string };

export type WorkspaceSnapshotPayload = {
  chat_id: string;
  user_id: string;
  files: SnapshotFile[];
  last_start_command?: string | null;
  updated_at?: string;
};

export async function upsertWorkspaceSnapshot(
  chatId: string,
  files: SnapshotFile[],
  userId: string,
  lastStartCommand?: string,
) {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('workspaces').upsert(
      {
        chat_id: chatId,
        user_id: userId,
        files,
        last_start_command: lastStartCommand || null,
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: 'chat_id' },
    );

    if (error) {
      throw error;
    }

    logger.debug('Workspace snapshot synced to backend', { chatId, fileCount: files.length });
  } catch (error) {
    logger.warn('Failed to sync workspace snapshot to backend (continuing with local only)', error);
  }
}

export async function fetchWorkspaceSnapshot(
  chatId: string,
  userId: string,
): Promise<{ files: SnapshotFile[]; last_start_command?: string } | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('workspaces')
      .select('files, last_start_command')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return { files: data.files || [], last_start_command: data.last_start_command || undefined };
  } catch (error) {
    logger.warn('Failed to fetch workspace snapshot from backend', error);
    return null;
  }
}
