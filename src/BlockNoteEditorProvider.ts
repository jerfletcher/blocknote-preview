import * as vscode from 'vscode';

export class BlockNoteEditorProvider implements vscode.CustomTextEditorProvider {
	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new BlockNoteEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(BlockNoteEditorProvider.viewType, provider);
		return providerRegistration;
	}

	public static readonly viewType = 'blocknote-markdown-editor.editor';

	constructor(
		private readonly context: vscode.ExtensionContext
	) {}

	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		token: vscode.CancellationToken
	): Promise<void> {
		//TODO desnt work, diff editor still opens custom editor
		console.log('🎨 Resolving custom text editor for:', document.fileName);
		console.log('📄 Document content length:', document.getText().length);
		
		// Check if this is being opened for diff comparison
		const activeTabGroup = vscode.window.tabGroups.activeTabGroup;
		const isDiffContext = activeTabGroup.tabs.some(tab => 
			tab.input instanceof vscode.TabInputTextDiff
		);
		
		if (isDiffContext) {
			console.log('🔍 Detected diff context - delegating to default text editor');
			// For diff comparisons, we should use the default text editor
			const config = vscode.workspace.getConfiguration('blocknote-markdown-editor');
			const useDiffForComparison = config.get<boolean>('useDiffForComparison', true);
			
			if (useDiffForComparison) {
				// Close this custom editor and open with default
				webviewPanel.dispose();
				await vscode.commands.executeCommand('vscode.openWith', document.uri, 'default');
				return;
			}
		}
		
		// Set custom icon for the webview panel (tab icon)
		webviewPanel.iconPath = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'blocknote-tab-icon.png');
		
		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};
		
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document);
		console.log('🌐 Webview HTML set');

		// Flag to prevent sync feedback loop
		let isUpdatingFromWebview = false;

		function updateWebview() {
			if (isUpdatingFromWebview) {
				console.log('🔄 Skipping webview update (currently updating from webview)');
				return;
			}
			console.log('📤 Updating webview with content length:', document.getText().length);
			webviewPanel.webview.postMessage({
				type: 'update',
				text: document.getText(),
			});
		}

		// Hook up event handlers so that we can synchronize the webview with the text document
		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				console.log('📝 Document changed externally');
				updateWebview();
			}
		});

		// Make sure we get rid of the listener when our editor is closed
		webviewPanel.onDidDispose(() => {
			console.log('🗑️ Webview panel disposed');
			changeDocumentSubscription.dispose();
		});

		// Receive message from the webview
		webviewPanel.webview.onDidReceiveMessage(async e => {
			console.log('📨 Received message from webview:', e.type, 'data length:', e.text?.length || 0);
			switch (e.type) {
				case 'save':
					console.log('💾 Saving content, length:', e.text?.length || 0);
					isUpdatingFromWebview = true;
					try {
						await this.updateTextDocument(document, e.text);
						// Reset flag after a short delay to allow VS Code to process the change
						setTimeout(() => {
							isUpdatingFromWebview = false;
						}, 100);
					} catch (error) {
						console.error('Error updating document:', error);
						isUpdatingFromWebview = false;
					}
					return;
				case 'ready':
					console.log('✅ Webview is ready, sending initial content');
					updateWebview();
					return;
			}
		});

		console.log('🚀 Custom editor initialized successfully for:', document.fileName);
	}

	private getHtmlForWebview(webview: vscode.Webview, document: vscode.TextDocument): string {
		// Local path to main webview script (bundled with BlockNote)
		const scriptPathOnDisk = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'webview.js');
		// And the uri we use to load this script in the webview
		const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

		// Local path to css files
		const styleResetPath = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'reset.css');
		const styleMainPath = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor.css');
		const styleWebviewPath = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'webview.css');
		const styleCodeMirrorPath = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'codemirror-styles.css');
		
		// Uri to load styles into webview
		const stylesResetUri = webview.asWebviewUri(styleResetPath);
		const stylesMainUri = webview.asWebviewUri(styleMainPath);
		const stylesWebviewUri = webview.asWebviewUri(styleWebviewPath);
		const stylesCodeMirrorUri = webview.asWebviewUri(styleCodeMirrorPath);

		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		return /* html */`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https: data:; font-src ${webview.cspSource};">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesResetUri}" rel="stylesheet" />
				<link href="${stylesMainUri}" rel="stylesheet" />
				<link href="${stylesWebviewUri}" rel="stylesheet" />
				<link href="${stylesCodeMirrorUri}" rel="stylesheet" />
				<style>
					/* Ensure proper styling for BlockNote */
					body {
						margin: 0;
						padding: 16px;
						height: 100vh;
						overflow-y: auto;
						overflow-x: hidden;
						box-sizing: border-box;
						background: var(--vscode-editor-background);
						color: var(--vscode-editor-foreground);
					}
					
					#root {
						min-height: calc(100vh - 32px);
						width: calc(100% - 32px);
					}
					
					/* BlockNote custom styling for VS Code integration */
					.bn-container {
						background-color: var(--vscode-editor-background) !important;
						color: var(--vscode-editor-foreground) !important;
					}
					
					.bn-editor {
						background-color: var(--vscode-editor-background) !important;
						color: var(--vscode-editor-foreground) !important;
					}
				</style>
				<title>BlockNote Editor</title>
			</head>
			<body>
				<div id="root">
					<div style="padding: 20px; color: var(--vscode-foreground); font-family: var(--vscode-editor-font-family);">
						Loading BlockNote editor...
					</div>
				</div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	/**
	 * Write out the markdown to a given document.
	 */
	private updateTextDocument(document: vscode.TextDocument, text: string) {
		const edit = new vscode.WorkspaceEdit();

		// Just replace the entire document every time for this example extension.
		// A more complete extension should compute minimal edits instead.
		edit.replace(
			document.uri,
			new vscode.Range(0, 0, document.lineCount, 0),
			text);

		return vscode.workspace.applyEdit(edit);
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
