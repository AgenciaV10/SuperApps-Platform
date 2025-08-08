import type { WebContainer } from '@webcontainer/api';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('WorkspaceSnapshot');

type SnapshotFile = {
  path: string;
  content: string; // utf-8 text
};

type WorkspaceSnapshot = {
  chatId: string;
  createdAt: number;
  files: SnapshotFile[];
  lastStartCommand?: string;
};

const DB_NAME = 'boltDIY';
const STORE = 'snapshots';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'chatId' });
      }
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

async function putSnapshot(snapshot: WorkspaceSnapshot): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);

      const store = tx.objectStore(STORE);
      store.put(snapshot);
    });
  } catch (error) {
    logger.error('Failed to save snapshot', error);
  }
}

async function getSnapshot(chatId: string): Promise<WorkspaceSnapshot | undefined> {
  try {
    const db = await openDb();
    return await new Promise<WorkspaceSnapshot | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const req = store.get(chatId);
      req.onsuccess = () => resolve(req.result as WorkspaceSnapshot | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    logger.error('Failed to load snapshot', error);
    return undefined;
  }
}

export async function deleteSnapshot(chatId: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE).delete(chatId);
    });
  } catch (error) {
    logger.error('Failed to delete snapshot', error);
  }
}

async function readDirectoryRecursive(
  webcontainer: WebContainer,
  dir: string,
  ignoredDirs: Set<string>,
): Promise<SnapshotFile[]> {
  const entries = await webcontainer.fs.readdir(dir, { withFileTypes: true }).catch(() => [] as any);
  const files: SnapshotFile[] = [];

  for (const entry of entries as Array<{ name: string; isFile: boolean; isDirectory: boolean }>) {
    const path = `${dir}/${entry.name}`.replace(/\\/g, '/');

    if (entry.isDirectory) {
      const name = entry.name;

      if (ignoredDirs.has(name)) {
        continue;
      }

      const nested = await readDirectoryRecursive(webcontainer, path, ignoredDirs);
      files.push(...nested);
    } else if (entry.isFile) {
      // Only keep reasonably small text files; skip huge ones silently
      try {
        const content = await webcontainer.fs.readFile(path, 'utf-8');
        files.push({ path, content });
      } catch {
        // binary or unreadable; skip
      }
    }
  }

  return files;
}

const debounceTimers = new Map<string, number>();

export async function saveWorkspaceSnapshot(
  webcontainer: WebContainer,
  chatId: string,
  opts?: { lastStartCommand?: string },
): Promise<void> {
  try {
    const ignored = new Set(['node_modules', '.git', '.history', 'dist', 'build', '.next']);
    const root = webcontainer.workdir;
    const files = await readDirectoryRecursive(webcontainer, root, ignored);
    const snapshot: WorkspaceSnapshot = {
      chatId,
      createdAt: Date.now(),
      files,
      lastStartCommand: opts?.lastStartCommand,
    };
    await putSnapshot(snapshot);
    logger.debug('Workspace snapshot saved', { chatId, fileCount: files.length });
  } catch (error) {
    logger.error('Failed to save workspace snapshot', error);
  }
}

export function scheduleWorkspaceSnapshot(
  webcontainer: WebContainer,
  chatId: string,
  opts?: { lastStartCommand?: string },
  delayMs: number = 800,
): void {
  try {
    if (debounceTimers.has(chatId)) {
      window.clearTimeout(debounceTimers.get(chatId)!);
    }

    const handle = window.setTimeout(() => {
      saveWorkspaceSnapshot(webcontainer, chatId, opts);
      debounceTimers.delete(chatId);
    }, delayMs);
    debounceTimers.set(chatId, handle);
  } catch (error) {
    logger.error('Failed to schedule snapshot', error);
  }
}

export async function restoreWorkspaceSnapshot(
  webcontainer: WebContainer,
  chatId: string,
): Promise<{
  restored: boolean;
  lastStartCommand?: string;
}> {
  const snapshot = await getSnapshot(chatId);

  if (!snapshot) {
    return { restored: false };
  }

  try {
    for (const file of snapshot.files) {
      const rel = file.path.replace(webcontainer.workdir, '').replace(/^\/+/, '');
      const full = `${webcontainer.workdir}/${rel}`.replace(/\\/g, '/');
      const folder = full.split('/').slice(0, -1).join('/');

      try {
        await webcontainer.fs.mkdir(folder, { recursive: true });
      } catch {}
      await webcontainer.fs.writeFile(full, file.content);
    }
    logger.info('Workspace snapshot restored', { chatId, fileCount: snapshot.files.length });

    return { restored: true, lastStartCommand: snapshot.lastStartCommand };
  } catch (error) {
    logger.error('Failed to restore workspace snapshot', error);
    return { restored: false };
  }
}

export function setLastStartCommand(chatId: string, command: string) {
  try {
    localStorage.setItem(`bolt-last-start-${chatId}`, command);
  } catch {}
}

export function getLastStartCommand(chatId: string): string | undefined {
  try {
    return localStorage.getItem(`bolt-last-start-${chatId}`) || undefined;
  } catch {
    return undefined;
  }
}
