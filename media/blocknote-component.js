// BlockNote React Component
// This file will be loaded after React and BlockNote libraries are available

console.log('Loading BlockNote React component...');

async function waitForBlockNoteModules() {
    console.log('Waiting for BlockNote modules to load...');
    
    if (window.BlockNotePromise) {
        return await window.BlockNotePromise;
    }
    
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50;
        
        function check() {
            attempts++;
            
            if (window.BlockNote && window.BlockNoteReact) {
                console.log('BlockNote modules detected');
                resolve(true);
            } else if (attempts < maxAttempts) {
                console.log(`Waiting for BlockNote modules... attempt ${attempts}/${maxAttempts}`);
                setTimeout(check, 100);
            } else {
                console.error('Failed to load BlockNote modules after', maxAttempts, 'attempts');
                resolve(false);
            }
        }
        
        check();
    });
}

// Initialize after dependencies are loaded
waitForBlockNoteModules().then((success) => {
    if (!success) {
        console.error('BlockNote modules failed to load');
        return;
    }
    
    const { createElement: h } = React;
    const { BlockNoteView, useCreateBlockNote } = window.BlockNoteReact;

    function BlockNoteEditor({ initialContent, onContentChange }) {
        console.log('Creating BlockNote editor with initial content:', initialContent?.slice(0, 100) + '...');
        
        const editor = useCreateBlockNote({
            initialContent: initialContent || undefined,
            // Enable slash menu functionality
            slashMenuItems: window.BlockNote.getDefaultSlashMenuItems(),
            // Enable formatting toolbar
            formattingToolbar: true,
        });

        const handleChange = React.useCallback(async () => {
            if (onContentChange && editor) {
                try {
                    // Convert BlockNote content to markdown
                    const markdown = await editor.blocksToMarkdownLossy(editor.document);
                    onContentChange(markdown);
                } catch (error) {
                    console.error('Error converting blocks to markdown:', error);
                }
            }
        }, [editor, onContentChange]);

        // Set up content change listener
        React.useEffect(() => {
            if (editor) {
                console.log('Setting up change listener');
                return editor.onChange(handleChange);
            }
        }, [editor, handleChange]);

        // Handle initial content setting
        React.useEffect(() => {
            if (initialContent && typeof initialContent === 'string' && editor) {
                console.log('Setting initial content:', initialContent.slice(0, 50) + '...');
                const updateContent = async () => {
                    try {
                        const blocks = await editor.tryParseMarkdownToBlocks(initialContent);
                        editor.replaceBlocks(editor.document, blocks);
                    } catch (error) {
                        console.warn('Failed to parse initial markdown content:', error);
                        // Fallback to plain text
                        const fallbackBlocks = [{
                            type: "paragraph",
                            content: [{ type: "text", text: initialContent, styles: {} }]
                        }];
                        editor.replaceBlocks(editor.document, fallbackBlocks);
                    }
                };
                updateContent();
            }
        }, [initialContent, editor]);

        return h(BlockNoteView, {
            editor,
            theme: 'dark', // Will be dynamically set based on VS Code theme
            slashMenu: true,
            formattingToolbar: true,
            style: {
                minHeight: '400px',
                fontFamily: 'var(--vscode-editor-font-family)',
                fontSize: 'var(--vscode-editor-font-size)',
                backgroundColor: 'var(--vscode-editor-background)',
                color: 'var(--vscode-editor-foreground)',
            }
        });
    }

    // Export for use in the webview
    window.BlockNoteEditor = BlockNoteEditor;
    console.log('BlockNote React component ready');
}).catch(error => {
    console.error('Error initializing BlockNote component:', error);
});
