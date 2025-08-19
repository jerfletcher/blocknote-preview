#!/bin/bash

echo "🧪 Testing BlockNote Extension"
echo "================================"

# Check if the extension is installed
echo "1. Checking if extension is installed..."
if code --list-extensions | grep -q "undefined_publisher.blocknote-markdown-editor"; then
    echo "✅ Extension is installed"
else
    echo "❌ Extension is not found in installed extensions"
    echo "Run: code --install-extension blocknote-markdown-editor-0.0.5.vsix --force"
    exit 1
fi

# Check if test file exists
echo "2. Checking test file..."
if [ -f "test-blocknote.md" ]; then
    echo "✅ Test file exists: test-blocknote.md"
else
    echo "❌ Test file not found"
    exit 1
fi

# Open the test file with VS Code
echo "3. Opening test file in VS Code..."
code test-blocknote.md

echo ""
echo "📋 Manual Testing Steps:"
echo "========================"
echo "1. In VS Code, right-click on 'test-blocknote.md' in the Explorer"
echo "2. Select 'Open with BlockNote' from the context menu"
echo "3. A new editor panel should open"
echo "4. Check the developer console (Right-click in editor → Inspect Element → Console)"
echo ""
echo "✅ SUCCESS indicators:"
echo "   - You see the test content in the editor"
echo "   - Console shows: 'BlockNote editor script loaded'"
echo "   - Console shows: 'BlockNote editor created successfully' OR 'Fallback editor ready'"
echo "   - You can edit the text and it saves"
echo ""
echo "❌ FAILURE indicators:"
echo "   - No content appears in the editor"
echo "   - Console shows errors"
echo "   - Right-click context menu doesn't show 'Open with BlockNote'"
echo ""
echo "🔍 If it fails, check the VS Code Output panel (View → Output) and select 'BlockNote Markdown Editor'"
