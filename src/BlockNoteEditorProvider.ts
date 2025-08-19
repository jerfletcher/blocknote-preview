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
		_token: vscode.CancellationToken
	): Promise<void> {
		console.log('🎨 Resolving custom text editor for:', document.fileName);
		console.log('📄 Document content length:', document.getText().length);
		
		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};
		
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document);
		console.log('🌐 Webview HTML set');

		function updateWebview() {
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
		webviewPanel.webview.onDidReceiveMessage(e => {
			console.log('📨 Received message from webview:', e.type, 'data length:', e.text?.length || 0);
			switch (e.type) {
				case 'save':
					console.log('💾 Saving content, length:', e.text?.length || 0);
					this.updateTextDocument(document, e.text);
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
		// Local path to main script run in the webview
		const scriptPathOnDisk = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor.js');
		// And the uri we use to load this script in the webview
		const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

		// Local path to css files
		const styleResetPath = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'reset.css');
		const styleMainPath = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor.css');
		
		// Uri to load styles into webview
		const stylesResetUri = webview.asWebviewUri(styleResetPath);
		const stylesMainUri = webview.asWebviewUri(styleMainPath);

		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		return /* html */`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline' https://unpkg.com; script-src 'nonce-${nonce}' 'unsafe-eval' 'unsafe-inline' https://unpkg.com; connect-src https://unpkg.com; img-src ${webview.cspSource} https: data:;">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesResetUri}" rel="stylesheet" />
				<link href="${stylesMainUri}" rel="stylesheet" />
				<title>BlockNote Editor</title>
			</head>
			<body>
				<div id="editor-container">
					<div style="padding: 20px; color: var(--vscode-foreground); font-family: var(--vscode-editor-font-family);">
						Initializing BlockNote editor...
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
