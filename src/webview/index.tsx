import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteEditor, BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

// VS Code API
declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();

// Function to detect VS Code theme
function getVSCodeTheme(): 'light' | 'dark' {
  // Check CSS custom properties
  const bodyStyles = getComputedStyle(document.body);
  const bgColor = bodyStyles.getPropertyValue('--vscode-editor-background').trim();
  
  if (bgColor) {
    // Convert hex or rgb to determine if it's dark
    const tempDiv = document.createElement('div');
    tempDiv.style.color = bgColor;
    document.body.appendChild(tempDiv);
    const rgb = getComputedStyle(tempDiv).color;
    document.body.removeChild(tempDiv);
    
    const match = rgb.match(/\d+/g);
    if (match) {
      const [r, g, b] = match.map(Number);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 128 ? 'dark' : 'light';
    }
  }
  
  // Fallback: check for VS Code theme class or default to dark
  return document.body.classList.contains('vscode-light') ? 'light' : 'dark';
}

interface BlockNoteEditorComponentProps {
  initialContent?: string;
  onContentChange?: (markdown: string) => void;
}

const BlockNoteEditorComponent: React.FC<BlockNoteEditorComponentProps> = ({ 
  initialContent = '', 
  onContentChange 
}) => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => getVSCodeTheme());
  const isUpdatingFromVSCode = React.useRef(false);
  const initialContentRef = React.useRef<string>('');
  const hasInitializedContent = React.useRef(false);
  
  const editor: BlockNoteEditor = useCreateBlockNote({
    schema: BlockNoteSchema.create({
      blockSpecs: {
        ...defaultBlockSpecs,
      },
    }),
    // Enable file upload (can be undefined to disable)
    uploadFile: undefined,
    // Configure better slash menu behavior
    domAttributes: {
      editor: {
        class: "bn-prosemirror-editor",
        "data-test": "editor",
        "data-editor-ready": "true"
      }
    }
  });

  // Update theme when VS Code theme changes
  React.useEffect(() => {
    const updateTheme = () => {
      setTheme(getVSCodeTheme());
    };
    
    // Watch for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.body, { 
      attributes: true, 
      attributeFilter: ['class', 'style'] 
    });
    
    // Also listen for CSS variable changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);
    
    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, []);

  // Handle content changes
  React.useEffect(() => {
    let lastSavedContent = initialContentRef.current;
    
    const handleChange = async () => {
      // Don't save changes if we're currently updating from VS Code or haven't initialized yet
      if (onContentChange && !isUpdatingFromVSCode.current && hasInitializedContent.current) {
        try {
          const markdown = await editor.blocksToMarkdownLossy(editor.document);
          
          // Normalize content for comparison (trim whitespace, normalize line endings)
          const normalizedMarkdown = markdown.replace(/\r\n/g, '\n').trim();
          const normalizedLastSaved = lastSavedContent.replace(/\r\n/g, '\n').trim();
          
          // Only save if content has actually changed to prevent sync loops
          if (normalizedMarkdown !== normalizedLastSaved) {
            console.log('Content actually changed, saving...');
            lastSavedContent = markdown;
            onContentChange(markdown);
          }
        } catch (error) {
          console.error('Error converting blocks to markdown:', error);
        }
      }
    };

    // Use a longer debounce to prevent rapid saves during typing
    let timeoutId: NodeJS.Timeout;
    const debouncedHandleChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleChange, 500); // Increased to 500ms
    };

    const unsubscribe = editor.onChange(debouncedHandleChange);
    return () => {
      clearTimeout(timeoutId);
      unsubscribe?.();
    };
  }, [editor, onContentChange]);

  // Handle initial content
  React.useEffect(() => {
    if (initialContent && !hasInitializedContent.current) {
      const updateContent = async () => {
        // Set flag to prevent saving during VS Code updates
        isUpdatingFromVSCode.current = true;
        initialContentRef.current = initialContent;
        
        try {
          // Get current content to compare
          const currentMarkdown = await editor.blocksToMarkdownLossy(editor.document);
          
          // Only update if content has actually changed to prevent cursor jumping
          if (currentMarkdown.trim() !== initialContent.trim()) {
            console.log('Content differs, updating editor. Current:', currentMarkdown.length, 'New:', initialContent.length);
            
            const blocks = await editor.tryParseMarkdownToBlocks(initialContent);
            editor.replaceBlocks(editor.document, blocks);
          }
        } catch (error) {
          console.warn('Failed to parse or update markdown content:', error);
        } finally {
          // Reset flag after update is complete and mark as initialized
          setTimeout(() => {
            isUpdatingFromVSCode.current = false;
            hasInitializedContent.current = true;
          }, 500); // Longer delay to ensure everything is settled
        }
      };
      updateContent();
    }
  }, [initialContent, editor]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <BlockNoteView 
        editor={editor}
        theme={theme}
        slashMenu={true}
        formattingToolbar={true}
        sideMenu={true}
        data-theming-css-variables-demo
        // Prevent cursor jumping during slash menu interactions
        onSelectionChange={() => {
          // Don't trigger rapid updates during selection changes
        }}
      />
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  const [content, setContent] = React.useState<string>('');
  const [isReady, setIsReady] = React.useState<boolean>(false);

  React.useEffect(() => {
    // Listen for messages from the extension
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      switch (message.type) {
        case 'update':
          console.log('Received content update, length:', message.text?.length || 0);
          setContent(message.text || '');
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Signal that webview is ready
    console.log('Webview ready, requesting initial content');
    vscode.postMessage({ type: 'ready' });
    setIsReady(true);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleContentChange = React.useCallback((markdown: string) => {
    console.log('Content changed, sending to extension, length:', markdown.length);
    vscode.postMessage({
      type: 'save',
      text: markdown
    });
  }, []);

  if (!isReady) {
    return (
      <div style={{ 
        padding: '20px', 
        color: 'var(--vscode-foreground)',
        fontFamily: 'var(--vscode-editor-font-family)'
      }}>
        Initializing BlockNote editor...
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%',
      backgroundColor: 'var(--vscode-editor-background)',
      color: 'var(--vscode-editor-foreground)'
    }}>
      <BlockNoteEditorComponent 
        initialContent={content}
        onContentChange={handleContentChange}
      />
    </div>
  );
};

// Initialize the React app
console.log('Starting BlockNote webview...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.innerHTML = '<div id="root"></div>';
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);

console.log('BlockNote webview initialized');
