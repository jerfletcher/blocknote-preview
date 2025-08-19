<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# BlockNote Markdown Editor VS Code Extension

This is a VS Code extension project that provides an enhanced markdown editing and preview experience using the BlockNote editor library.

## Project Status

✅ **COMPLETED SETUP TASKS**

- [x] Verify that the copilot-instructions.md file in the .github directory is created. ✅ Created
- [x] Clarify Project Requirements ✅ VS Code extension for markdown editor using BlockNote library with preview and editing capabilities
- [x] Scaffold the Project ✅ VS Code extension scaffolded with TypeScript and esbuild
- [x] Customize the Project ✅ Created BlockNote editor provider, webview components, and media files
- [x] Install Required Extensions ✅ No additional extensions needed from get_project_setup_info
- [x] Compile the Project ✅ Project compiled successfully with TypeScript and esbuild
- [x] Create and Run Task ✅ Build task created and running in watch mode
- [x] Launch the Project ✅ Ready to launch - user should press F5 to debug
- [x] Ensure Documentation is Complete ✅ README.md updated and copilot-instructions.md exists

## Architecture

- **Extension Entry Point**: `src/extension.ts` - Registers commands and custom editor provider
- **Custom Editor Provider**: `src/BlockNoteEditorProvider.ts` - Handles markdown file editing with BlockNote
- **Webview Assets**: `media/` directory contains CSS, JavaScript, and other assets for the editor UI
- **Build System**: Uses esbuild for bundling and TypeScript for type checking

## Development Instructions

1. The project is ready for development
2. Press **F5** to launch the extension in a new VS Code window for testing
3. Open any `.md` file and use the context menu to "Edit with BlockNote"
4. The build system is running in watch mode to automatically rebuild on changes

## Current State

The extension provides:
- Custom editor provider for markdown files
- Webview-based editor interface
- VS Code integration with context menus and commands
- Basic markdown editing capabilities (textarea-based for now)

## Next Steps for Enhancement

- Integrate full BlockNote rich text editor in the webview
- Add more sophisticated markdown parsing and rendering
- Implement better synchronization between text and visual modes
- Add additional editor features and toolbar options
