import * as vscode from 'vscode';

interface SnippetData {
  id: string;
  title: string;
  description: string | null;
  code: string;
  language: string;
  isFavorite: boolean;
  folderId: string | null;
  folderName: string | null;
  tags: string[];
}

interface FolderData {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  snippetCount: number;
}

export function activate(context: vscode.ExtensionContext) {
  console.log('SnippNXT Extension is now active!');

  const config = vscode.workspace.getConfiguration('snippnxt');
  const getApiUrl = () => config.get<string>('apiUrl', 'http://localhost:3000');

  // 1. Status Bar Item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'snippnxt.refreshSnippets';
  statusBarItem.text = '$(code) SnippNXT: Connected';
  statusBarItem.tooltip = 'SnippNXT Backend Sync Active (Click to refresh)';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // 2. Tree Data Provider for Sidebar
  const treeProvider = new SnippetsTreeProvider(getApiUrl);
  vscode.window.registerTreeDataProvider('snippnxt-snippets', treeProvider);

  // 3. Register Command: Refresh
  const refreshCommand = vscode.commands.registerCommand('snippnxt.refreshSnippets', () => {
    treeProvider.refresh();
    vscode.window.showInformationMessage('SnippNXT: Snippets refreshed from database.');
  });

  // 4. Register Command: Save Selection as Snippet
  const saveSnippetCommand = vscode.commands.registerCommand('snippnxt.saveSnippet', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active text editor found.');
      return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection).trim();

    if (!selectedText) {
      vscode.window.showWarningMessage('Please select some code to save as a snippet.');
      return;
    }

    const title = await vscode.window.showInputBox({
      prompt: 'Enter a title for this snippet',
      placeHolder: 'e.g. Binary Search in Python',
      validateInput: (val) => (val.trim() ? null : 'Title cannot be empty'),
    });

    if (!title) return;

    // Optional folder selection
    let selectedFolderId: string | undefined = undefined;
    try {
      const res = await fetch(`${getApiUrl()}/api/snippets`);
      if (res.ok) {
        const data = (await res.json()) as { folders: FolderData[] };
        if (data.folders && data.folders.length > 0) {
          const folderItems = [
            { label: '$(folder) (None / General)', folderId: undefined },
            ...data.folders.map((f) => ({
              label: `$(folder) ${f.name}`,
              folderId: f.id,
            })),
          ];
          const chosen = await vscode.window.showQuickPick(folderItems, {
            placeHolder: 'Select a coursework folder (optional)',
          });
          if (chosen) selectedFolderId = chosen.folderId;
        }
      }
    } catch {
      // Ignore network errors when fetching folders
    }

    const tagsInput = await vscode.window.showInputBox({
      prompt: 'Enter tags (comma separated)',
      placeHolder: 'e.g. algorithms, search, recursion',
    });

    const tags = tagsInput
      ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const description = await vscode.window.showInputBox({
      prompt: 'Enter a short note or explanation (optional)',
      placeHolder: 'Time complexity: O(log n)',
    });

    try {
      const postRes = await fetch(`${getApiUrl()}/api/snippets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          code: selectedText,
          language: editor.document.languageId || 'plaintext',
          folderId: selectedFolderId,
          tags,
          description: description || undefined,
        }),
      });

      if (!postRes.ok) {
        throw new Error(`Failed to save snippet: ${postRes.statusText}`);
      }

      vscode.window.showInformationMessage(`SnippNXT: Saved "${title}" to your library!`);
      treeProvider.refresh();
    } catch (err: any) {
      vscode.window.showErrorMessage(`SnippNXT Error: ${err.message || 'Could not connect to SnippNXT server'}`);
    }
  });

  // 5. Register Command: Explain Code with AI
  let currentExplainPanel: vscode.WebviewPanel | undefined = undefined;

  const explainCodeCommand = vscode.commands.registerCommand('snippnxt.explainCode', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active text editor found.');
      return;
    }

    const selection = editor.selection;
    const selectedCode = editor.document.getText(selection).trim() || editor.document.getText().slice(0, 3000);

    if (!selectedCode) {
      vscode.window.showWarningMessage('No code selected to explain.');
      return;
    }

    const fileName = editor.document.fileName.split(/[\\/]/).pop() || 'Untitled';
    const language = editor.document.languageId || 'code';

    if (currentExplainPanel) {
      currentExplainPanel.reveal(vscode.ViewColumn.Beside);
    } else {
      currentExplainPanel = vscode.window.createWebviewPanel(
        'snippnxtExplain',
        `Explain: ${fileName}`,
        vscode.ViewColumn.Beside,
        { enableScripts: true }
      );
      currentExplainPanel.onDidDispose(() => {
        currentExplainPanel = undefined;
      });
    }

    currentExplainPanel.webview.html = getExplainWebviewHtml(fileName, language);

    try {
      const res = await fetch(`${getApiUrl()}/api/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: selectedCode,
          language,
          filename: fileName,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Explanation request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          currentExplainPanel.webview.postMessage({ type: 'chunk', text: chunk });
        }
      }

      currentExplainPanel.webview.postMessage({ type: 'done' });
    } catch (err: any) {
      currentExplainPanel.webview.postMessage({
        type: 'error',
        text: `Error connecting to SnippNXT AI service: ${err.message}`,
      });
    }
  });

  // 6. Register Command: Insert Snippet at Cursor
  const insertSnippetCommand = vscode.commands.registerCommand('snippnxt.insertSnippet', async (item?: SnippetTreeItem) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('Open an editor to insert code snippet.');
      return;
    }

    if (item && item.code) {
      editor.edit((editBuilder) => {
        editBuilder.insert(editor.selection.active, item.code);
      });
      vscode.window.showInformationMessage(`Inserted "${item.label}"`);
      return;
    }

    // Otherwise show QuickPick of all snippets
    try {
      const res = await fetch(`${getApiUrl()}/api/snippets`);
      if (!res.ok) throw new Error('Failed to fetch snippets');
      const data = (await res.json()) as { snippets: SnippetData[] };
      const items = data.snippets.map((s) => ({
        label: `$(code) ${s.title}`,
        description: `[${s.language}] ${s.folderName ? `📁 ${s.folderName}` : ''}`,
        detail: s.description || s.code.slice(0, 100),
        code: s.code,
      }));

      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Search and insert a SnippNXT snippet',
      });

      if (picked) {
        editor.edit((editBuilder) => {
          editBuilder.insert(editor.selection.active, picked.code);
        });
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to retrieve snippets: ${err.message}`);
    }
  });

  // 7. Register Command: Open Web Dashboard
  const openDashboardCommand = vscode.commands.registerCommand('snippnxt.openWebDashboard', () => {
    vscode.env.openExternal(vscode.Uri.parse(getApiUrl()));
  });

  context.subscriptions.push(
    refreshCommand,
    saveSnippetCommand,
    explainCodeCommand,
    insertSnippetCommand,
    openDashboardCommand
  );
}

export function deactivate() {}

// ==================== TREE DATA PROVIDER ====================

type TreeNode = FolderTreeItem | SnippetTreeItem;

class SnippetsTreeProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeNode | undefined | void> =
    new vscode.EventEmitter<TreeNode | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeNode | undefined | void> =
    this._onDidChangeTreeData.event;

  private snippets: SnippetData[] = [];
  private folders: FolderData[] = [];

  constructor(private getApiUrl: () => string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TreeNode): Promise<TreeNode[]> {
    if (!element) {
      // Root level: fetch data from API
      try {
        const res = await fetch(`${this.getApiUrl()}/api/snippets`);
        if (!res.ok) return [];
        const data = (await res.json()) as { snippets: SnippetData[]; folders: FolderData[] };
        this.snippets = data.snippets || [];
        this.folders = data.folders || [];

        const items: TreeNode[] = [];

        // Add Folders
        for (const folder of this.folders) {
          items.push(
            new FolderTreeItem(
              folder.name,
              folder.id,
              folder.snippetCount,
              vscode.TreeItemCollapsibleState.Collapsed
            )
          );
        }

        // Add Uncategorized / All root snippets
        const generalSnippets = this.snippets.filter((s) => !s.folderId);
        for (const snip of generalSnippets) {
          items.push(
            new SnippetTreeItem(
              snip.title,
              snip.code,
              snip.language,
              snip.tags,
              vscode.TreeItemCollapsibleState.None
            )
          );
        }

        return items;
      } catch (err) {
        console.error('Error fetching tree data:', err);
        return [];
      }
    }

    if (element instanceof FolderTreeItem) {
      // Children of a folder
      const folderSnippets = this.snippets.filter((s) => s.folderId === element.folderId);
      return folderSnippets.map(
        (snip) =>
          new SnippetTreeItem(
            snip.title,
            snip.code,
            snip.language,
            snip.tags,
            vscode.TreeItemCollapsibleState.None
          )
      );
    }

    return [];
  }
}

class FolderTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly folderId: string,
    public readonly count: number,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${label} (${count} snippets)`;
    this.description = `${count}`;
    this.iconPath = new vscode.ThemeIcon('folder');
    this.contextValue = 'folder';
  }
}

class SnippetTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly code: string,
    public readonly language: string,
    public readonly tags: string[],
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `Language: ${language}\n\n${code.slice(0, 200)}...`;
    this.description = `[${language}] ${tags.length > 0 ? `#${tags.join(' #')}` : ''}`;
    this.iconPath = new vscode.ThemeIcon('code');
    this.contextValue = 'snippet';

    // Click to insert snippet into editor
    this.command = {
      command: 'snippnxt.insertSnippet',
      title: 'Insert Snippet',
      arguments: [this],
    };
  }
}

// ==================== WEBVIEW HTML GENERATOR ====================

function getExplainWebviewHtml(filename: string, language: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SnippNXT AI Explanation</title>
  <style>
    body {
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);
      color: var(--vscode-editor-foreground, #D4D4D4);
      background-color: var(--vscode-editor-background, #1E1E1E);
      padding: 16px;
      line-height: 1.6;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid var(--vscode-panel-border, rgba(255,255,255,0.1));
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .badge {
      background: var(--vscode-badge-background, #4D4D4D);
      color: var(--vscode-badge-foreground, #FFFFFF);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 600;
    }
    .title {
      font-size: 15px;
      font-weight: 600;
      color: var(--vscode-textLink-foreground, #3794FF);
    }
    #content {
      white-space: pre-wrap;
      font-size: 13px;
      line-height: 1.6;
    }
    .cursor {
      display: inline-block;
      width: 7px;
      height: 14px;
      background: var(--vscode-textLink-activeForeground, #75BEFF);
      vertical-align: middle;
      animation: blink 0.8s infinite;
      margin-left: 2px;
    }
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
    .status {
      font-size: 11px;
      color: var(--vscode-descriptionForeground, #888);
      margin-top: 16px;
      border-top: 1px solid var(--vscode-panel-border, rgba(255,255,255,0.1));
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="badge">${language}</span>
    <span class="title">AI Explanation: ${filename}</span>
  </div>
  <div id="content"></div>
  <span id="cursor" class="cursor"></span>
  <div class="status" id="status">Streaming analysis from SnippNXT...</div>

  <script>
    const vscode = acquireVsCodeApi();
    const contentEl = document.getElementById('content');
    const cursorEl = document.getElementById('cursor');
    const statusEl = document.getElementById('status');

    window.addEventListener('message', event => {
      const message = event.data;
      if (message.type === 'chunk') {
        contentEl.textContent += message.text;
        window.scrollTo(0, document.body.scrollHeight);
      } else if (message.type === 'done') {
        cursorEl.style.display = 'none';
        statusEl.textContent = 'Explanation complete · SnippNXT Code Intelligence';
      } else if (message.type === 'error') {
        cursorEl.style.display = 'none';
        contentEl.textContent += '\\n\\n' + message.text;
        statusEl.textContent = 'Error encountered';
      }
    });
  </script>
</body>
</html>`;
}
