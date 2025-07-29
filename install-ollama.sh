#!/bin/bash

# Install and setup Ollama for changelog AI analysis
echo "🚀 Installing Ollama for AI changelog generation..."

# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

echo "✅ Ollama installed"

# Start Ollama service in background
echo "🔄 Starting Ollama service..."
ollama serve &
OLLAMA_PID=$!

# Wait for service to start
sleep 5

# Pull the model
echo "📥 Pulling CodeLlama model (this may take a few minutes)..."
ollama pull llama3.2:1b

# Verify installation
echo "🔍 Verifying Ollama installation..."
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama is running successfully"
    echo "🤖 Available models:"
    curl -s http://localhost:11434/api/tags | jq '.models[].name' 2>/dev/null || echo "codellama:7b-code (installed)"
else
    echo "❌ Ollama is not responding"
    exit 1
fi

echo ""
echo "🎉 Setup complete! You can now run the AI changelog script without --no-ai flag"
echo ""
echo "📋 To test the AI changelog generation:"
echo "source server/venv/bin/activate && python .github/scripts/update-changelog-ai.py \\"
echo "  --pr-number 10 \\"
echo "  --pr-title 'Test AI Analysis' \\"
echo "  --pr-author test-user \\"
echo "  --base-sha ab3784395c8f3992f694b3a3a10024adb8d569ce \\"
echo "  --head-sha 735f60e366341fc6086e83c73c1a61264571b129"
echo ""
echo "💡 To stop Ollama: kill $OLLAMA_PID"
echo "💡 To start Ollama again: ollama serve &"