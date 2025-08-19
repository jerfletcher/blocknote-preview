# BlockNote Markdown Editor

A Visual Studio Code extension that provides an enhanced markdown editing and preview experience using the BlockNote editor.

## Features

- **Rich Markdown Editing**: Edit markdown files using the BlockNote rich text editor
- **Live Preview**: See your markdown rendered in real-time as you type
- **VS Code Integration**: Seamlessly integrated with VS Code's file explorer and editor tabs
- **Dual Mode**: Switch between traditional text editing and visual editing

## Usage

### Opening Markdown Files with BlockNote

1. Right-click on any `.md` file in the Explorer
2. Select "Open BlockNote Preview" or "Edit with BlockNote"
3. Alternatively, use the command palette (`Cmd+Shift+P`) and search for "BlockNote"

### Commands

- `BlockNote: Open Preview` - Opens the selected markdown file in preview mode
- `BlockNote: Edit with BlockNote` - Opens the selected markdown file in the BlockNote editor

## Installation

1. Install the extension from the VS Code marketplace
2. Open any markdown file
3. Use the context menu or command palette to open with BlockNote

## Development

### Prerequisites

- Node.js (latest LTS version)
- npm
- VS Code

### Building from Source

1. Clone the repository
2. Install dependencies: `npm install`
3. Compile the extension: `npm run compile`
4. Run in development mode: Press `F5` to open a new VS Code window with the extension loaded

### Project Structure

```
├── src/
│   ├── extension.ts              # Main extension entry point
│   └── BlockNoteEditorProvider.ts # Custom editor provider
├── media/
│   ├── editor.css               # Webview styles
│   ├── editor.js               # Webview JavaScript
│   └── reset.css               # CSS reset
├── package.json                 # Extension manifest
└── README.md                   # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the extension
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built with [BlockNote](https://www.blocknotejs.org/) - A rich text editor for React
- Powered by the [VS Code Extension API](https://code.visualstudio.com/api)
