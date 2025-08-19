import { WebContainer } from '@webcontainer/api';
import { WORK_DIR_NAME } from '~/utils/constants';
import { cleanStackTrace } from '~/utils/stacktrace';
import {
  restoreWorkspaceSnapshot,
  scheduleWorkspaceSnapshot,
  getLastStartCommand,
} from '~/lib/persistence/workspaceSnapshot';
import { getCurrentChatId } from '~/utils/fileLocks';

interface WebContainerContext {
  loaded: boolean;
}

export const webcontainerContext: WebContainerContext = import.meta.hot?.data.webcontainerContext ?? {
  loaded: false,
};

if (import.meta.hot) {
  import.meta.hot.data.webcontainerContext = webcontainerContext;
}

export let webcontainer: Promise<WebContainer> = new Promise(() => {
  // noop for ssr
});

if (!import.meta.env.SSR) {
  webcontainer =
    import.meta.hot?.data.webcontainer ??
    Promise.resolve()
      .then(() => {
        return WebContainer.boot({
          coep: 'credentialless',
          workdirName: WORK_DIR_NAME,
          forwardPreviewErrors: true, // Enable error forwarding from iframes
        });
      })
      .then(async (webcontainer) => {
        webcontainerContext.loaded = true;

        const { workbenchStore } = await import('~/lib/stores/workbench');

        const response = await fetch('/inspector-script.js');
        const inspectorScript = await response.text();
        await webcontainer.setPreviewScript(inspectorScript);

        // Try restoring last workspace snapshot for current chat on boot
        try {
          const chat = getCurrentChatId();
          const restored = await restoreWorkspaceSnapshot(webcontainer, chat);

          if (restored.restored) {
            console.log('Restored workspace from snapshot for chat', chat);

            // Auto-start dev server if we have last start command
            const startCmd = getLastStartCommand(chat) || restored.lastStartCommand;

            if (startCmd) {
              try {
                const parts = startCmd.split(/\s+/).filter(Boolean);
                const cmd = parts[0];
                const args = parts.slice(1);
                const p = await webcontainer.spawn(cmd, args);

                // Consume output to keep process alive & avoid backpressure
                p.output.pipeTo(new WritableStream({ write() {} })).catch(() => {});
                p.exit.then((code) => console.log('Auto-start process exited', code)).catch(() => {});
              } catch (e) {
                console.warn('Failed to auto-start dev server from snapshot', e);
              }
            }
          }

          // Remote workspace sync disabled by default for performance
        } catch (e) {
          console.warn('Failed to restore workspace snapshot', e);
        }

        // Listen for preview errors - with safety check
        if (webcontainer && typeof webcontainer.on === 'function') {
          webcontainer.on('preview-message', (message) => {
            console.log('WebContainer preview message:', message);

            // Handle both uncaught exceptions and unhandled promise rejections
            if (message.type === 'PREVIEW_UNCAUGHT_EXCEPTION' || message.type === 'PREVIEW_UNHANDLED_REJECTION') {
              const isPromise = message.type === 'PREVIEW_UNHANDLED_REJECTION';
              const title = isPromise ? 'Unhandled Promise Rejection' : 'Uncaught Exception';
              workbenchStore.actionAlert.set({
                type: 'preview',
                title,
                description: 'message' in message ? message.message : 'Unknown error',
                content: `Error occurred at ${message.pathname}${message.search}${message.hash}\nPort: ${message.port}\n\nStack trace:\n${cleanStackTrace(message.stack || '')}`,
                source: 'preview',
              });

              // Auto-heal common low-code generation errors to avoid breaking UX
              (async () => {
                try {
                  const stack: string = (message as any).stack || '';
                  const msg: string = (message as any).message || '';

                  // Try to extract a source file from the stack (e.g., /src/App.tsx)
                  const filePathMatch = stack.match(/\/src\/[\w./-]+\.(tsx|ts|jsx|js)/);
                  const filePath = filePathMatch ? filePathMatch[0] : undefined;

                  if (!filePath) {
                    return;
                  }

                  const fileFullPath = `${WORK_DIR_NAME}${filePath.startsWith('/') ? '' : '/'}${filePath}`;

                  // 1) Fix missing default export in App.tsx
                  if (/does not provide an export named 'default'/.test(msg) && /\/src\/App\.(tsx|jsx)/.test(filePath)) {
                    const content = await webcontainer.fs.readFile(fileFullPath, 'utf-8');

                    if (!/export\s+default\s+/.test(content)) {
                      let newContent = content;

                      if (
                        /export\s+function\s+App\s*\(/.test(content) ||
                        /function\s+App\s*\(/.test(content) ||
                        /const\s+App\s*=\s*\(/.test(content)
                      ) {
                        // Append default export for existing App component
                        newContent = `${content}\n\nexport default App;\n`;
                      } else {
                        // Fallback: create noop default export to unblock preview
                        newContent = `${content}\n\nconst AppDefaultExport = () => null;\nexport default AppDefaultExport;\n`;
                      }

                      await webcontainer.fs.writeFile(fileFullPath, newContent);

                      // Persist snapshot after autocure
                      scheduleWorkspaceSnapshot(webcontainer, getCurrentChatId());
                    }
                  }

                  // 2) Fix invalid lucide-react icon imports (e.g., Bread)
                  if (/does not provide an export named/.test(msg) && /lucide-react/.test(stack)) {
                    const content = await webcontainer.fs.readFile(fileFullPath, 'utf-8');

                    if (/from\s+['"]lucide-react['"]/.test(content)) {
                      const safeIcon = 'Rocket';

                      // Replace import line to a single safe icon
                      let newContent = content.replace(
                        /import\s*\{[^}]*\}\s*from\s*['"]lucide-react['"];?/g,
                        `import { ${safeIcon} } from 'lucide-react';`,
                      );

                      // Replace usages of unknown icons (<Bread .../>) to <Rocket .../>
                      newContent = newContent.replace(/<([A-Z][A-Za-z0-9_]*)\b([^>]*)\/>/g, (m, name, attrs) => {
                        // if it's a likely lucide icon usage and not App/HTML tags (heuristic)
                        if (name && name !== 'App' && name !== 'Fragment' && /^[A-Z]/.test(name)) {
                          return `<${safeIcon}${attrs}/>`;
                        }

                        return m;
                      });
                      await webcontainer.fs.writeFile(fileFullPath, newContent);
                      scheduleWorkspaceSnapshot(webcontainer, getCurrentChatId());
                    }
                  }

                  /*
                   * 3) Ensure named export exists when importer expects it
                   * Pattern: "The requested module '/src/Note.tsx' does not provide an export named 'Note'"
                   */
                  const namedExportMatch = msg.match(/does not provide an export named '([A-Za-z0-9_]+)'/);

                  if (namedExportMatch && filePath.startsWith('/src/')) {
                    const expectedName = namedExportMatch[1];
                    let content = await webcontainer.fs.readFile(fileFullPath, 'utf-8');

                    // If already exports named, skip
                    if (!new RegExp(`export\\s+(const|function|class)\\s+${expectedName}\\b`).test(content)) {
                      // Case A: export default function ...
                      if (/export\s+default\s+function\s+/.test(content)) {
                        // Turn default function into named and default
                        content = content.replace(
                          /export\s+default\s+function\s+([A-Za-z0-9_]*)?\s*\(/,
                          () => `function ${expectedName}(`,
                        );

                        if (!/export\s+default\s+/.test(content)) {
                          content += `\nexport default ${expectedName};\n`;
                        } else {
                          // Ensure default export exists
                          content += `\nexport default ${expectedName};\n`;
                        }

                        content += `export { ${expectedName} };\n`;
                        await webcontainer.fs.writeFile(fileFullPath, content);
                        scheduleWorkspaceSnapshot(webcontainer, getCurrentChatId());
                      }
                      // Case B: export default <expr>
                      else if (/export\s+default\s+\(/.test(content) || /export\s+default\s+[^\n;]+;?/.test(content)) {
                        content = content.replace(/export\s+default\s+/, `const ${expectedName} = `);
                        content += `\nexport default ${expectedName};\nexport { ${expectedName} };\n`;
                        await webcontainer.fs.writeFile(fileFullPath, content);
                        scheduleWorkspaceSnapshot(webcontainer, getCurrentChatId());
                      }
                      // Case C: default assigned identifier e.g., const X = ...; export default X
                      else if (/export\s+default\s+[A-Za-z0-9_]+\s*;?/.test(content)) {
                        const defId = content.match(/export\s+default\s+([A-Za-z0-9_]+)/)?.[1];

                        if (defId) {
                          content += `\nexport { ${defId} as ${expectedName} };\n`;
                          await webcontainer.fs.writeFile(fileFullPath, content);
                          scheduleWorkspaceSnapshot(webcontainer, getCurrentChatId());
                        }
                      }
                    }
                  }
                } catch (e) {
                  console.warn('Auto-heal failed:', e);
                }
              })();
            }
          });
        } else {
          console.warn('WebContainer instance not available or missing event listener methods');
        }

        return webcontainer;
      });

  if (import.meta.hot) {
    import.meta.hot.data.webcontainer = webcontainer;
  }
}
