# BlockNote Markdown Editor

A VS Code extension that provides an enhanced markdown editing and preview experience using the BlockNote rich text editor library.

## Features

- Rich text editing for markdown files using BlockNote
- Custom editor provider that integrates with VS Code
- Context menu integration for markdown files
- Real-time preview capabilities
- Modern TypeScript and React-based architecture

## Installation

### From VSIX Package

1. Download the latest `.vsix` file from the releases
2. Install using VS Code command palette: `Extensions: Install from VSIX...`
3. Select the downloaded `.vsix` file

### Development Installation

```bash
# Clone the repository
git clone https://github.com/jerfletcher/blocknote-preview.git
cd blocknote-preview

# Install dependencies
npm install

# Build and install the extension
npm run install:vsix
```

## Development

### Prerequisites

- Node.js (v20 or later)
- npm
- VS Code

### Setup

```bash
# Install dependencies
npm install
```

### Building

The project includes several build scripts for different scenarios:

#### Development Build
```bash
# One-time build for development
npm run build:dev

# Or simply
npm run build
```

#### Production Build
```bash
# Build optimized version for production
npm run build:prod
```

#### Watch Mode (Recommended for Development)
```bash
# Start watch mode for active development
npm run dev

# Or
npm run watch
```

This will start both TypeScript type checking and esbuild in watch mode, automatically rebuilding when files change.

#### Package as VSIX
```bash
# Create a .vsix package file
npm run package:vsix

# Build and install the extension in VS Code
npm run install:vsix
```

### Available NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Standard development build |
| `npm run build:dev` | Development build with source maps |
| `npm run build:prod` | Production build (optimized) |
| `npm run dev` | Start development with watch mode |
| `npm run watch` | Watch for changes and rebuild |
| `npm run package` | Create production bundle |
| `npm run package:vsix` | Package as VSIX extension |
| `npm run install:vsix` | Build and install extension in VS Code |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint and fix auto-fixable issues |
| `npm run check-types` | Type check without building |
| `npm run clean` | Remove build artifacts and VSIX files |
| `npm run test` | Run tests |

### Development Workflow

1. **Start Development**: `npm run dev` - This starts watch mode
2. **Launch Extension**: Press `F5` in VS Code to open Extension Development Host
3. **Test Changes**: Open any `.md` file and use "Open with BlockNote" from context menu
4. **Package**: `npm run package:vsix` when ready to create installable extension

### Project Structure

```
├── src/
│   ├── extension.ts              # Extension entry point
│   ├── BlockNoteEditorProvider.ts # Custom editor provider
│   └── webview/
│       └── index.tsx             # React webview component
├── media/                        # Webview assets (CSS, JS, fonts)
├── dist/                        # Built extension files
└── *.vsix                       # Packaged extension files
```

## Architecture

- **Extension Host**: Registers commands and custom editor provider
- **Webview**: React-based editor interface using BlockNote components
- **Build System**: esbuild for fast bundling, TypeScript for type checking
- **Custom Editor**: Handles markdown files with rich text editing capabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` and `npm run test`
5. Create a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Repository

https://github.com/jerfletcher/blocknote-preview