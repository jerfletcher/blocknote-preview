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
        const editor = useCreateBlockNote({
            initialContent: initialContent || [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Start writing your markdown...",
                            styles: {}
                        }
                    ]
                }
            ]
        });

        const handleChange = React.useCallback(() => {
            if (onContentChange) {
                // Convert BlockNote content to markdown
                const markdown = editor.blocksToMarkdownLossy(editor.document);
                onContentChange(markdown);
            }
        }, [editor, onContentChange]);

        React.useEffect(() => {
            editor.onChange(handleChange);
        }, [editor, handleChange]);

        React.useEffect(() => {
            if (initialContent && typeof initialContent === 'string') {
                // Convert markdown to BlockNote blocks
                const blocks = editor.tryParseMarkdownToBlocks(initialContent);
                editor.replaceBlocks(editor.document, blocks);
            }
        }, [initialContent, editor]);

        return h(BlockNoteView, {
            editor,
            theme: 'dark', // Will be dynamically set based on VS Code theme
            style: {
                minHeight: '400px',
                fontFamily: 'var(--vscode-editor-font-family)',
                fontSize: 'var(--vscode-editor-font-size)',
            }
        });
    }

    // Export for use in the webview
    window.BlockNoteEditor = BlockNoteEditor;
    console.log('BlockNote React component ready');
});
