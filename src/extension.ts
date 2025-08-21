// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { BlockNoteEditorProvider } from './BlockNoteEditorProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('✅ BlockNote extension is now active!');

	// Register the custom editor provider
	const provider = new BlockNoteEditorProvider(context);
	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(BlockNoteEditorProvider.viewType, provider)
	);
	console.log('📝 Custom editor provider registered');

	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand('blocknote-markdown-editor.openEditor', (uri?: vscode.Uri) => {
			console.log('🎯 BlockNote command triggered', uri?.fsPath || 'no URI');
			const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
			if (targetUri) {
				console.log('🚀 Opening file with BlockNote:', targetUri.fsPath);
				vscode.commands.executeCommand('vscode.openWith', targetUri, BlockNoteEditorProvider.viewType);
			} else {
				console.error('❌ No file URI available');
				vscode.window.showErrorMessage('No file selected to open with BlockNote');
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('blocknote-markdown-editor.newFile', async () => {
			console.log('📄 Creating new BlockNote markdown file');
			try {
				// Create a new untitled document with .md extension
				const document = await vscode.workspace.openTextDocument({
					content: '# New BlockNote Document\n\nStart writing your markdown content here...',
					language: 'markdown'
				});
				
				// Show the document in an editor
				const editor = await vscode.window.showTextDocument(document);
				
				// Open with BlockNote custom editor
				await vscode.commands.executeCommand('vscode.openWith', document.uri, BlockNoteEditorProvider.viewType);
				
				console.log('✅ New BlockNote file created and opened');
			} catch (error) {
				console.error('❌ Failed to create new BlockNote file:', error);
				vscode.window.showErrorMessage('Failed to create new BlockNote markdown file');
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('blocknote-markdown-editor.openWithDefault', (uri?: vscode.Uri) => {
			console.log('📝 Opening with default markdown editor', uri?.fsPath || 'current file');
			const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
			if (targetUri) {
				console.log('🚀 Opening file with default editor:', targetUri.fsPath);
				vscode.commands.executeCommand('vscode.openWith', targetUri, 'default');
			} else {
				console.error('❌ No file URI available');
				vscode.window.showErrorMessage('No file selected to open with default editor');
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('blocknote-markdown-editor.toggleEditor', (uri?: vscode.Uri) => {
			console.log('🔄 Toggling between BlockNote and default editor');
			const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
			if (targetUri) {
				// Check if the active tab is a custom editor
				const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
				const isBlockNoteEditor = activeTab?.input instanceof vscode.TabInputCustom && 
					activeTab.input.viewType === BlockNoteEditorProvider.viewType;
				
				if (isBlockNoteEditor) {
					console.log('🚀 Switching from BlockNote to default editor');
					vscode.commands.executeCommand('vscode.openWith', targetUri, 'default');
				} else {
					console.log('🚀 Switching from default to BlockNote editor');
					vscode.commands.executeCommand('vscode.openWith', targetUri, BlockNoteEditorProvider.viewType);
				}
			} else {
				console.error('❌ No file URI available');
				vscode.window.showErrorMessage('No file selected to toggle editor');
			}
		})
	);

	context.subscriptions.push(
		//TODO doesnt work , still opens custom in diff
		vscode.commands.registerCommand('blocknote-markdown-editor.compareFiles', async (uri?: vscode.Uri) => {
			console.log('🔍 Starting file comparison with default diff view');
			
			if (!uri) {
				vscode.window.showErrorMessage('No file selected for comparison');
				return;
			}

			// Let user select the second file to compare with
			const secondFile = await vscode.window.showOpenDialog({
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: false,
				filters: {
					'Markdown files': ['md']
				},
				title: 'Select file to compare with'
			});

			if (secondFile && secondFile[0]) {
				console.log('🚀 Opening diff view:', uri.fsPath, 'vs', secondFile[0].fsPath);
				
				// Force open both files with default text editor and then show diff
				await vscode.commands.executeCommand('vscode.diff', uri, secondFile[0], 
					`${uri.fsPath.split('/').pop()} ↔ ${secondFile[0].fsPath.split('/').pop()}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('blocknote-markdown-editor.toggleViewMode', () => {
			console.log('🔄 Toggling view mode');
			
			// Get the active editor
			const activeEditor = vscode.window.activeTextEditor;
			if (!activeEditor) {
				const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
				if (activeTab?.input instanceof vscode.TabInputCustom && 
					activeTab.input.viewType === BlockNoteEditorProvider.viewType) {
					
					// Send message to webview to toggle view mode
					// We'll need to implement this in the provider
					vscode.commands.executeCommand('workbench.action.webview.openDeveloperTools');
					vscode.window.showInformationMessage('Use the toggle buttons in the editor to switch between Rich Editor and Markdown Text views');
				}
				return;
			}
		})
	);
	console.log('🔧 Commands registered');
}

// This method is called when your extension is deactivated
export function deactivate() {}
