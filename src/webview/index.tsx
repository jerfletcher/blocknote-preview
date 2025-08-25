import * as React from 'react';
import { useRef, useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import { 
  BlockNoteEditor, 
  BlockNoteSchema, 
  defaultBlockSpecs,
  getDefaultSlashMenuItems
} from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import mermaid from 'mermaid';

// CodeMirror imports - custom setup without line numbers
import { EditorView } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle, HighlightStyle } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { tags } from '@lezer/highlight';

// VS Code API
declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();

// Initialize Mermaid
mermaid.initialize({ 
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true
  }
});

// Mermaid React Component
const MermaidChart: React.FC<{ 
  code: string; 
  onEdit: () => void; 
  theme: 'light' | 'dark';
}> = ({ code, onEdit, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isRendering, setIsRendering] = React.useState(false);

  useEffect(() => {
    if (!containerRef.current || !code.trim()) return;

    const renderChart = async () => {
      setIsRendering(true);
      setError(null);
      
      try {
        // Update mermaid theme based on VS Code theme
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === 'dark' ? 'dark' : 'default',
          securityLevel: 'loose',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true
          }
        });

        // Generate unique ID for this chart
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Validate and render the diagram
        const { svg } = await mermaid.render(id, code.trim());
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      } finally {
        setIsRendering(false);
      }
    };

    renderChart();
  }, [code, theme]);

  if (!code.trim()) {
    return (
      <div 
        style={{
          border: '2px dashed var(--vscode-textBlockQuote-border, #007acc)',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          color: 'var(--vscode-textBlockQuote-foreground, #cccccc)',
          backgroundColor: 'var(--vscode-textBlockQuote-background, rgba(0, 122, 204, 0.1))',
          cursor: 'pointer',
          minHeight: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={onEdit}
      >
        Click to add Mermaid diagram
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Edit button */}
      <button
        onClick={onEdit}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          zIndex: 10,
          background: 'var(--vscode-button-background, #0e639c)',
          color: 'var(--vscode-button-foreground, white)',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '12px',
          cursor: 'pointer',
          opacity: 0.7
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
      >
        Edit
      </button>
      
      {isRendering && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: 'var(--vscode-foreground, #cccccc)'
        }}>
          Rendering diagram...
        </div>
      )}
      
      {error && (
        <div style={{
          padding: '20px',
          background: 'var(--vscode-inputValidation-errorBackground, rgba(244, 67, 54, 0.1))',
          border: '1px solid var(--vscode-inputValidation-errorBorder, #f44336)',
          borderRadius: '4px',
          color: 'var(--vscode-inputValidation-errorForeground, #f44336)',
          fontSize: '14px'
        }}>
          <strong>Mermaid Error:</strong> {error}
        </div>
      )}
      
      <div 
        ref={containerRef}
        style={{
          width: '100%',
          textAlign: 'center',
          backgroundColor: 'var(--vscode-editor-background)',
          padding: '10px',
          borderRadius: '4px',
          display: error ? 'none' : 'block'
        }}
      />
    </div>
  );
};

// Mermaid Block Spec
const MermaidBlock = createReactBlockSpec(
  {
    type: "mermaid" as const,
    propSchema: {
      code: {
        default: "" as const,
      },
    },
    content: "none",
  },
  {
    render: (props) => {
      const theme = getVSCodeTheme();
      
      return (
        <MermaidChart
          code={props.block.props.code}
          theme={theme}
          onEdit={() => {
            const newCode = prompt("Enter Mermaid diagram code:", props.block.props.code);
            if (newCode !== null) {
              props.editor.updateBlock(props.block, {
                type: "mermaid",
                props: { code: newCode },
              });
            }
          }}
        />
      );
    },
    toExternalHTML: (props) => {
      // Export as proper markdown code block
      return `\`\`\`mermaid\n${props.block.props.code}\n\`\`\``;
    },
    parse: (element) => {
      console.log('=== PARSE DEBUG ===');
      console.log('Parsing element:', element.tagName, element.getAttribute('data-content-type'));
      
      // Handle direct mermaid block markers
      if (element.tagName === "DIV" && element.getAttribute("data-content-type") === "mermaid") {
        const encodedCode = element.getAttribute("data-code");
        if (encodedCode) {
          const code = decodeURIComponent(encodedCode);
          console.log('Successfully parsed mermaid block with code:', code);
          return { code };
        }
      }
      console.log('Parse failed for element');
      return undefined;
    },
  }
);

// Function to parse and extract front matter from markdown
function parseFrontMatter(markdown: string): { content: string; frontMatter: any } {
  const frontMatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
  const match = markdown.match(frontMatterRegex);
  
  if (match) {
    const frontMatterText = match[1];
    const content = markdown.slice(match[0].length);
    
    // Try to parse YAML front matter (basic parsing)
    let frontMatter: any = {};
    try {
      frontMatterText.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.slice(0, colonIndex).trim();
          const value = line.slice(colonIndex + 1).trim();
          frontMatter[key] = value.replace(/^['"](.*)['"]$/, '$1'); // Remove quotes
        }
      });
    } catch (error) {
      console.warn('Failed to parse front matter:', error);
    }
    
    return { content, frontMatter };
  }
  
  return { content: markdown, frontMatter: {} };
}

// Function to add front matter back to markdown
function addFrontMatterToMarkdown(content: string, frontMatter: any): string {
  if (!frontMatter || Object.keys(frontMatter).length === 0) {
    return content;
  }
  
  const frontMatterLines = Object.entries(frontMatter).map(([key, value]) => {
    // Add quotes if value contains special characters or spaces
    const stringValue = String(value);
    const needsQuotes = stringValue.includes(' ') || stringValue.includes(':') || stringValue.includes('#');
    return `${key}: ${needsQuotes ? `"${stringValue}"` : stringValue}`;
  });
  
  return `---\n${frontMatterLines.join('\n')}\n---\n\n${content}`;
}

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

// Function to transform markdown with mermaid code blocks to custom blocks
function transformMermaidCodeBlocks(markdown: string): string {
  console.log('=== TRANSFORM DEBUG ===');
  console.log('Input markdown:', markdown);
  
  // Instead of HTML transformation, let's manually convert the markdown
  const lines = markdown.split('\n');
  const result: string[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Check if this line starts a mermaid code block
    if (line.trim() === '```mermaid') {
      console.log('Found mermaid block start at line', i);
      // Find the end of the code block
      let j = i + 1;
      const codeLines: string[] = [];
      
      while (j < lines.length && lines[j].trim() !== '```') {
        codeLines.push(lines[j]);
        j++;
      }
      
      if (j < lines.length) {
        // Found the closing ```, create a custom block marker
        const mermaidCode = codeLines.join('\n');
        console.log('Mermaid code found:', mermaidCode);
        result.push(`<div data-content-type="mermaid" data-code="${encodeURIComponent(mermaidCode)}"></div>`);
        i = j + 1; // Skip past the closing ```
      } else {
        // No closing ```, treat as regular line
        result.push(line);
        i++;
      }
    } else {
      result.push(line);
      i++;
    }
  }
  
  const transformed = result.join('\n');
  console.log('Transformed result:', transformed);
  console.log('=== END TRANSFORM DEBUG ===');
  
  return transformed;
}

// CodeMirror Editor Component
interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme: 'light' | 'dark';
}

// Simple CodeMirror editor using basic setup
const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({ value, onChange, theme }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isUpdatingProgrammatically = useRef(false);

  useEffect(() => {
    if (!editorRef.current) return;

    // Create editor with minimal setup - styles handled by CSS
    const extensions = [
      markdown(),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isUpdatingProgrammatically.current) {
          onChange(update.state.doc.toString());
        }
      }),
    ];

    // Add basic theme extension only
    if (theme === 'dark') {
      extensions.push(oneDark);
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [theme]);

  // Update content when value changes externally
  useEffect(() => {
    if (viewRef.current) {
      const currentValue = viewRef.current.state.doc.toString();
      if (currentValue !== value) {
        isUpdatingProgrammatically.current = true;
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentValue.length,
            insert: value,
          },
        });
        // Reset flag after a brief delay
        setTimeout(() => {
          isUpdatingProgrammatically.current = false;
        }, 100);
      }
    }
  }, [value]);

  return (
    <div 
      ref={editorRef} 
      className={`codemirror-container ${theme === 'dark' ? 'cm-theme-dark' : 'cm-theme-light'}`}
    />
  );
};

interface BlockNoteEditorComponentProps {
  initialContent?: string;
  onContentChange?: (markdown: string) => void;
  viewMode?: 'rich' | 'text';
  onViewModeChange?: (mode: 'rich' | 'text') => void;
}

const BlockNoteEditorComponent: React.FC<BlockNoteEditorComponentProps> = ({ 
  initialContent = '', 
  onContentChange,
  viewMode = 'rich',
  onViewModeChange
}) => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => getVSCodeTheme());
  const [textContent, setTextContent] = React.useState<string>('');
  const [scrollPosition, setScrollPosition] = React.useState<number>(0);
  const isUpdatingFromVSCode = React.useRef(false);
  const isSwitchingViewMode = React.useRef(false);
  const hasUserEditedText = React.useRef(false);
  const initialContentRef = React.useRef<string>('');
  const hasInitializedContent = React.useRef(false);
  const frontMatterRef = React.useRef<any>({});
  
  const editor = useCreateBlockNote({
    schema: BlockNoteSchema.create({
      blockSpecs: {
        ...defaultBlockSpecs,
        mermaid: MermaidBlock,
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
    
    const handleRichChange = async () => {
      // Don't save changes if we're currently updating from VS Code, switching view modes, or haven't initialized yet
      if (onContentChange && !isUpdatingFromVSCode.current && !isSwitchingViewMode.current && hasInitializedContent.current && viewMode === 'rich') {
        try {
          const markdown = await editor.blocksToMarkdownLossy(editor.document);
          
          // Add front matter back to the content before saving
          const markdownWithFrontMatter = addFrontMatterToMarkdown(markdown, frontMatterRef.current);
          
          // Update text content to keep in sync
          setTextContent(markdownWithFrontMatter);
          
          // Normalize content for comparison (trim whitespace, normalize line endings)
          const normalizedMarkdown = markdownWithFrontMatter.replace(/\r\n/g, '\n').trim();
          const normalizedLastSaved = lastSavedContent.replace(/\r\n/g, '\n').trim();
          
          // Only save if content has actually changed to prevent sync loops
          if (normalizedMarkdown !== normalizedLastSaved) {
            console.log('Rich content actually changed, saving...');
            lastSavedContent = markdownWithFrontMatter;
            onContentChange(markdownWithFrontMatter);
          }
        } catch (error) {
          console.error('Error converting blocks to markdown:', error);
        }
      }
    };

    // Use a longer debounce to prevent rapid saves during typing
    let timeoutId: NodeJS.Timeout;
    const debouncedHandleRichChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleRichChange, 500); // Increased to 500ms
    };

    const unsubscribe = editor.onChange(debouncedHandleRichChange);
    return () => {
      clearTimeout(timeoutId);
      unsubscribe?.();
    };
  }, [editor, onContentChange, viewMode]);

  // Handle text area changes - for CodeMirror with immediate saving
  const handleTextChange = React.useCallback((value: string) => {
    console.log('CodeMirror text changed');
    setTextContent(value);
    
    // Mark that user has edited text content
    if (!isSwitchingViewMode.current && !isUpdatingFromVSCode.current) {
      hasUserEditedText.current = true;
    }
    
    // Only save if we're not switching view modes and not updating from VS Code
    if (onContentChange && !isSwitchingViewMode.current && !isUpdatingFromVSCode.current) {
      console.log('Saving CodeMirror changes immediately');
      onContentChange(value);
    }
  }, [onContentChange]);

  // Ensure text content is populated when switching to text view
  const handleViewModeChange = React.useCallback(async (newMode: 'rich' | 'text') => {
    console.log('Switching view mode from', viewMode, 'to', newMode);
    
    // Set flag to prevent unwanted saves during view mode switching
    isSwitchingViewMode.current = true;
    
    // Save changes if user edited text content and we're switching away from text view
    if (viewMode === 'text' && hasUserEditedText.current && textContent && onContentChange) {
      console.log('Saving user-edited text content before switching to rich view');
      onContentChange(textContent);
      hasUserEditedText.current = false; // Reset the flag
    }
    
    // Save current scroll position before switching
    const currentScrollElement = viewMode === 'rich' 
      ? document.querySelector('.bn-editor .ProseMirror')
      : document.querySelector('.codemirror-container .cm-scroller');
    
    let currentScrollPos = 0;
    if (currentScrollElement) {
      currentScrollPos = currentScrollElement.scrollTop;
      setScrollPosition(currentScrollPos);
    }
    
    if (newMode === 'text') {
      // Always sync from rich editor to text view when switching to text mode
      try {
        const markdown = await editor.blocksToMarkdownLossy(editor.document);
        const markdownWithFrontMatter = addFrontMatterToMarkdown(markdown, frontMatterRef.current);
        console.log('Switching to text view, content length:', markdownWithFrontMatter.length);
        setTextContent(markdownWithFrontMatter);
        hasUserEditedText.current = false; // Reset flag when switching to text view
      } catch (error) {
        console.error('Error preparing text content:', error);
        // Fallback to current textContent if available
        if (!textContent && initialContentRef.current) {
          console.log('Fallback: using initial content');
          setTextContent(initialContentRef.current);
        } else if (!textContent) {
          // For untitled documents, set empty string to prevent undefined
          setTextContent('');
        }
      }
    }
    onViewModeChange?.(newMode);
    
    // If switching to rich view, ensure text content is synced to rich editor immediately
    if (newMode === 'rich') {
      const syncToRichImmediate = async () => {
        try {
          // Handle empty textContent for untitled documents
          const contentToSync = textContent || '';
          const { content: contentWithoutFrontMatter, frontMatter } = parseFrontMatter(contentToSync);
          frontMatterRef.current = frontMatter;
          
          console.log('Syncing text content to rich editor immediately, content:', contentWithoutFrontMatter.length, 'chars');
          isUpdatingFromVSCode.current = true; // Prevent save during sync
          
          if (contentWithoutFrontMatter.trim()) {
            const transformedContent = transformMermaidCodeBlocks(contentWithoutFrontMatter);
            console.log('Original content:', contentWithoutFrontMatter.substring(0, 200));
            console.log('Transformed content:', transformedContent.substring(0, 200));
            
            try {
              const blocks = await editor.tryParseMarkdownToBlocks(transformedContent);
              console.log('Parsed blocks count:', blocks.length);
              console.log('First few blocks:', blocks.slice(0, 3));
              editor.replaceBlocks(editor.document, blocks);
            } catch (error) {
              console.error('Error parsing markdown to blocks:', error);
              // Fallback to plain text
              editor.replaceBlocks(editor.document, [{
                type: "paragraph" as const,
                content: contentWithoutFrontMatter
              }]);
            }
          } else {
            // For empty content, create a single empty paragraph with proper typing
            const emptyBlocks = [{
              type: "paragraph" as const,
              content: []
            }];
            editor.replaceBlocks(editor.document, emptyBlocks);
          }
          
          // Reset flag after sync
          isUpdatingFromVSCode.current = false;
        } catch (error) {
          console.error('Error syncing text to rich view:', error);
          isUpdatingFromVSCode.current = false;
        }
      };
      
      // Execute sync immediately without delay
      syncToRichImmediate();
    }
    
    // Restore scroll position after a short delay to allow view to render
    setTimeout(() => {
      const newScrollElement = newMode === 'rich'
        ? document.querySelector('.bn-editor .ProseMirror')
        : document.querySelector('.codemirror-container .cm-scroller');
      
      if (newScrollElement && currentScrollPos > 0) {
        newScrollElement.scrollTop = currentScrollPos;
      }
      
      // Reset view mode switching flag after everything settles
      isSwitchingViewMode.current = false;
    }, 200);
  }, [editor, onViewModeChange, textContent, viewMode, scrollPosition]);

  // Sync between rich and text views (for ongoing changes, not view switching)
  React.useEffect(() => {
    const syncToText = async () => {
      if (viewMode === 'text' && hasInitializedContent.current && !isSwitchingViewMode.current) {
        try {
          const markdown = await editor.blocksToMarkdownLossy(editor.document);
          const markdownWithFrontMatter = addFrontMatterToMarkdown(markdown, frontMatterRef.current);
          if (markdownWithFrontMatter !== textContent) {
            setTextContent(markdownWithFrontMatter);
          }
        } catch (error) {
          console.error('Error syncing to text view:', error);
        }
      }
    };

    // Only sync ongoing changes, view switching is handled separately
    if (!isSwitchingViewMode.current) {
      const timer = setTimeout(() => {
        if (viewMode === 'text') {
          syncToText();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [viewMode, editor]);

  // Handle initial content
  React.useEffect(() => {
    if (!hasInitializedContent.current) {
      const updateContent = async () => {
        // Set flag to prevent saving during VS Code updates
        isUpdatingFromVSCode.current = true;
        
        // Handle both cases: when we have initial content from file, and when we have empty/untitled document
        const contentToUse = initialContent || '';
        initialContentRef.current = contentToUse;
        
        try {
          // Parse front matter from the initial content (or empty string)
          const { content: contentWithoutFrontMatter, frontMatter } = parseFrontMatter(contentToUse);
          frontMatterRef.current = frontMatter;
          
          // Set text content immediately with full original content
          setTextContent(contentToUse);
          console.log('Setting initial text content:', contentToUse.length, 'chars');
          if (contentToUse.length > 0) {
            console.log('Content preview:', contentToUse.substring(0, 200) + '...');
          }
          
          // Get current content to compare (without front matter)
          const currentMarkdown = await editor.blocksToMarkdownLossy(editor.document);
          
          // Update editor content if different, or if it's empty for untitled docs
          if (currentMarkdown.trim() !== contentWithoutFrontMatter.trim()) {
            console.log('Content differs, updating editor. Current:', currentMarkdown.length, 'New:', contentWithoutFrontMatter.length);
            console.log('Front matter extracted:', frontMatter);
            
            if (contentWithoutFrontMatter.trim()) {
              const transformedContent = transformMermaidCodeBlocks(contentWithoutFrontMatter);
              console.log('Setting content from update, original:', contentWithoutFrontMatter.substring(0, 100));
              console.log('Setting content from update, transformed:', transformedContent.substring(0, 100));
              
              try {
                const blocks = await editor.tryParseMarkdownToBlocks(transformedContent);
                console.log('Parsed blocks from content update:', blocks.length);
                editor.replaceBlocks(editor.document, blocks);
              } catch (error) {
                console.error('Error parsing content update:', error);
                // Fallback 
                editor.replaceBlocks(editor.document, [{
                  type: "paragraph" as const,
                  content: contentWithoutFrontMatter
                }]);
              }
            }
            // If content is empty, BlockNote will default to empty paragraph, which is fine
          }
        } catch (error) {
          console.warn('Failed to parse or update markdown content:', error);
        } finally {
          // Reset flag after update is complete and mark as initialized
          setTimeout(() => {
            isUpdatingFromVSCode.current = false;
            hasInitializedContent.current = true;
            hasUserEditedText.current = false; // Reset edit flag
            console.log('Initialization complete - text content:', textContent.length);
          }, 500); // Longer delay to ensure everything is settled
        }
      };
      updateContent();
    }
  }, [initialContent, editor]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* Toggle Button - Fixed at Top Right */}
      <button
        onClick={() => handleViewModeChange(viewMode === 'rich' ? 'text' : 'rich')}
        title={viewMode === 'rich' ? 'Switch to Markdown Text View' : 'Switch to Rich Editor View'}
        style={{
          position: 'fixed',
          top: '0',
          right: '0',
          zIndex: 1000,
          width: '40px',
          height: '32px',
          border: 'none',
          borderRadius: '0',
          backgroundColor: 'transparent',
          color: 'var(--vscode-foreground, #cccccc)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          padding: '0',
          outline: 'none',
          opacity: '0.7'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.backgroundColor = 'var(--vscode-toolbar-hoverBackground, rgba(255,255,255,0.1))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.7';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {viewMode === 'rich' ? '⟨/⟩' : '📝'}
      </button>

      {/* Content Area - Full Screen */}
      {viewMode === 'rich' ? (
        <div style={{ 
          height: '100%', 
          width: '100%',
          position: 'relative'
        }}>
          <BlockNoteView 
            editor={editor}
            theme={theme}
            slashMenu={true}
            formattingToolbar={true}
            sideMenu={true}
            data-theming-css-variables-demo
          />
        </div>
      ) : (
        <div style={{ 
          height: '100%', 
          width: '100%',
          position: 'relative'
        }}>
          <CodeMirrorEditor
            value={textContent}
            onChange={handleTextChange}
            theme={theme}
          />
        </div>
      )}
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  const [content, setContent] = React.useState<string>('');
  const [isReady, setIsReady] = React.useState<boolean>(false);
  const [viewMode, setViewMode] = React.useState<'rich' | 'text'>(() => {
    // Try to get default from VS Code settings via a message (we'll implement this)
    // For now, default to 'rich'
    return 'rich';
  });

  // Debug logging for content changes
  React.useEffect(() => {
    console.log('Main App content updated, length:', content.length);
  }, [content]);

  React.useEffect(() => {
    // Listen for messages from the extension
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      switch (message.type) {
        case 'update':
          console.log('Received content update, length:', message.text?.length || 0);
          setContent(message.text || '');
          break;
        case 'toggleViewMode':
          console.log('Toggling view mode from extension');
          setViewMode(prev => prev === 'rich' ? 'text' : 'rich');
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
      color: 'var(--vscode-editor-foreground)'
    }}>
      <BlockNoteEditorComponent 
        initialContent={content}
        onContentChange={handleContentChange}
        viewMode={viewMode}
        onViewModeChange={(newMode) => {
          console.log('View mode changing to:', newMode);
          setViewMode(newMode);
        }}
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
