// @ts-check

// Get access to the VS Code API from within the webview context
const vscode = acquireVsCodeApi();

// Import BlockNote (will be bundled)
// Note: In a real extension, you'd need to bundle BlockNote properly
// For now, we'll create a simplified version

(function() {
    let editor;
    let currentContent = '';

    // Initialize the editor when the page loads
    window.addEventListener('DOMContentLoaded', () => {
        initializeEditor();
    });

    function initializeEditor() {
        const container = document.getElementById('editor-container');
        if (!container) {
            console.error('Editor container not found');
            return;
        }

        // Create a simple textarea-based editor for now
        // In a real implementation, you'd initialize BlockNote here
        const textarea = document.createElement('textarea');
        textarea.id = 'markdown-editor';
        textarea.style.width = '100%';
        textarea.style.height = '100%';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.fontFamily = 'var(--vscode-editor-font-family)';
        textarea.style.fontSize = 'var(--vscode-editor-font-size)';
        textarea.style.backgroundColor = 'var(--vscode-editor-background)';
        textarea.style.color = 'var(--vscode-editor-foreground)';
        textarea.style.padding = '20px';

        // Handle content changes
        textarea.addEventListener('input', () => {
            currentContent = textarea.value;
            // Debounce saving
            clearTimeout(textarea.saveTimeout);
            textarea.saveTimeout = setTimeout(() => {
                save();
            }, 500);
        });

        container.appendChild(textarea);
        editor = textarea;

        // Request initial content
        vscode.postMessage({ type: 'ready' });
    }

    function save() {
        vscode.postMessage({
            type: 'save',
            text: currentContent
        });
    }

    function updateContent(text) {
        if (editor && text !== currentContent) {
            currentContent = text;
            editor.value = text;
        }
    }

    // Handle messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        
        switch (message.type) {
            case 'update':
                updateContent(message.text);
                break;
        }
    });

    // Save when the editor loses focus
    window.addEventListener('blur', () => {
        if (currentContent !== editor?.value) {
            save();
        }
    });
})();
