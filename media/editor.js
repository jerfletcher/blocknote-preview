// @ts-check

// Get access to the VS Code API from within the webview context
// @ts-ignore
const vscode = acquireVsCodeApi();

// BlockNote editor integration
(function() {
    let currentContent = '';
    let isInitialized = false;
    let blockNoteEditor = null;

    console.log('BlockNote editor script loaded');

    // Initialize the editor when the page loads
    window.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing editor');
        initializeEditor();
    });

    async function initializeEditor() {
        const container = document.getElementById('editor-container');
        if (!container) {
            console.error('Editor container not found');
            return;
        }

        container.innerHTML = '<div style="padding: 20px; color: var(--vscode-foreground); font-family: var(--vscode-editor-font-family);">Loading BlockNote editor...</div>';
        
        // Initialize BlockNote using the bundled version
        try {
            await initializeBlockNoteFromBundle();
        } catch (error) {
            console.error('Failed to initialize BlockNote editor:', error);
            initializeFallbackEditor(container);
        }
    }

    function initializeFallbackEditor(container) {
        console.log('Initializing fallback markdown editor');
        
        const editor = document.createElement('textarea');
        editor.style.cssText = `
            width: calc(100% - 32px);
            height: calc(100vh - 80px);
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
            padding: 16px;
            margin: 20px;
            font-family: var(--vscode-editor-font-family);
            font-size: 14px;
            line-height: 1.6;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            outline: none;
            resize: none;
            box-sizing: border-box;
        `;
        
        editor.placeholder = 'Start writing your markdown...';
        
        // Handle content changes
        let saveTimeout;
        editor.addEventListener('input', () => {
            const text = editor.value;
            
            if (text !== currentContent) {
                currentContent = text;
                console.log('Fallback editor content changed, length:', text.length);
                
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    console.log('Saving fallback editor content');
                    vscode.postMessage({
                        type: 'save',
                        text: currentContent
                    });
                }, 300);
            }
        });
        
        container.innerHTML = '';
        container.appendChild(editor);
        
        blockNoteEditor = editor;
        isInitialized = true;
        
        console.log('Fallback editor ready');
        
        // Request initial content
        vscode.postMessage({ type: 'ready' });
    }

    function updateContent(text) {
        console.log('updateContent called with text length:', text?.length || 0);
        
        if (text === currentContent) {
            console.log('Content unchanged, skipping update');
            return;
        }
        
        currentContent = text || '';
        
        if (blockNoteEditor && isInitialized) {
            console.log('Updating editor content');
            if (blockNoteEditor.tagName === 'TEXTAREA') {
                blockNoteEditor.value = currentContent;
            } else if (blockNoteEditor.updateContent) {
                // React-based BlockNote editor
                blockNoteEditor.updateContent(currentContent);
            } else {
                // Fallback contentEditable editor
                blockNoteEditor.textContent = currentContent;
            }
        } else {
            console.log('Editor not ready yet, will update when ready');
        }
    }

    async function initializeBlockNoteFromBundle() {
    console.log('Initializing BlockNote editor from ES modules');
    
    // Wait for dependencies to load
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
        if (window.React && 
            window.ReactDOM && 
            // @ts-ignore
            window.BlockNote && 
            // @ts-ignore
            window.BlockNoteReact &&
            // @ts-ignore
            window.BlockNoteEditor) {
            console.log('All BlockNote dependencies and component are ready');
            break;
        }
        
        // @ts-ignore
        if (window.BlockNotePromise) {
            console.log('Waiting for BlockNote promise to resolve...');
            // @ts-ignore
            await window.BlockNotePromise;
            // Wait a bit more for the component to load
            await new Promise(resolve => setTimeout(resolve, 500));
        } else {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        attempts++;
    }
    
    // @ts-ignore
    if (attempts >= maxAttempts || !window.BlockNoteEditor) {
        throw new Error('BlockNote dependencies not available after waiting');
    }

    // Create the React container
    const container = document.getElementById('editor-container');
    if (!container) {
        throw new Error('Editor container not found');
    }
    
    container.innerHTML = '<div id="blocknote-root"></div>';
    
    // Use React 18 createRoot if available, fallback to ReactDOM.render
    const rootElement = document.getElementById('blocknote-root');
    let renderFunction;
    
    // @ts-ignore - ReactDOM may have createRoot in newer versions
    if (window.ReactDOM && window.ReactDOM.createRoot) {
        // @ts-ignore
        const root = window.ReactDOM.createRoot(rootElement);
        renderFunction = (element) => root.render(element);
    } else if (window.ReactDOM && window.ReactDOM.render) {
        // @ts-ignore
        renderFunction = (element) => root.render(element);
    // @ts-ignore
    } else if (window.ReactDOM && window.ReactDOM.render) {
    } else {
        throw new Error('ReactDOM not available for rendering');
    }
    
    function onContentChange(markdown) {
        if (vscode) {
            vscode.postMessage({
                type: 'save',
                text: markdown
            });
        }
    }
    
    function updateContent(text) {
        // @ts-ignore
        if (window.React && window.BlockNoteEditor) {
            // @ts-ignore
            renderFunction(window.React.createElement(window.BlockNoteEditor, {
                initialContent: text,
                onContentChange: onContentChange
            }));
        }
    }
    
    // Initial render
    // @ts-ignore
    if (window.React && window.BlockNoteEditor) {
        // @ts-ignore
        renderFunction(window.React.createElement(window.BlockNoteEditor, {
            initialContent: '',
            onContentChange: onContentChange
        }));
    }
    
    console.log('BlockNote editor initialized successfully');
    return { updateContent };
}

    // Handle messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        console.log('Received message from extension:', message.type);
        if (message.text) {
            console.log('Message text length:', message.text.length);
        }
        
        switch (message.type) {
            case 'update':
                updateContent(message.text);
                break;
        }
    });

    // Save when the editor loses focus
    window.addEventListener('blur', () => {
        if (currentContent && blockNoteEditor) {
            console.log('Window blur, saving content');
            vscode.postMessage({
                type: 'save',
                text: currentContent
            });
        }
    });

    console.log('Editor script initialization complete');
})();
