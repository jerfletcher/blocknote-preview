import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteEditor, BlockNoteSchema, defaultBlockSpecs, filterSuggestionItems } from '@blocknote/core';
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
  
  const editor: BlockNoteEditor = useCreateBlockNote({
    schema: BlockNoteSchema.create({
      blockSpecs: {
        ...defaultBlockSpecs,
      },
    }),
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
    const handleChange = async () => {
      if (onContentChange) {
        const markdown = await editor.blocksToMarkdownLossy(editor.document);
        onContentChange(markdown);
      }
    };

    editor.onChange(handleChange);
    return () => {
      // Cleanup if needed
    };
  }, [editor, onContentChange]);

  // Handle initial content
  React.useEffect(() => {
    if (initialContent) {
      const updateContent = async () => {
        try {
          const blocks = await editor.tryParseMarkdownToBlocks(initialContent);
          editor.replaceBlocks(editor.document, blocks);
        } catch (error) {
          console.warn('Failed to parse initial markdown content:', error);
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
        data-theming-css-variables-demo
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
      height: '100vh', 
      width: '100%',
      backgroundColor: 'var(--vscode-editor-background)',
      color: 'var(--vscode-editor-foreground)',
      overflow: 'hidden'
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
