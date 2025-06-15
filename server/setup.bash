#!/bin/bash

set -e

SHOW_HELP=false
PORT=8000

setup() {
    echo "Setting up venv..."
    python3 -m venv venv || { echo "Failed to create virtual environment"; exit 1; }
    source venv/bin/activate || { echo "Failed to activate virtual environment"; exit 1; }
    python -m pip install --upgrade pip || { echo "Failed to upgrade pip"; exit 1; }
    pip install --no-cache-dir -r requirements.txt || { echo "Failed to install requirements"; exit 1; }
    echo "Done"
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            SHOW_HELP=true
            shift
            ;;
        --venv)
            setup
            shift
            ;;
        *)
            echo "Unknown option: $1"
            SHOW_HELP=true
            shift
            ;;
    esac
done

if [ "$SHOW_HELP" = true ]; then
    cat << 'EOF'
Usage: $0 [OPTIONS]

Options:
  -h, --help    Show this help message
  --venv        Setup venv to run locally. Need venv installed for python3

Description:
  This script deploys a local server to handle some basic parsing
  functions for credit card statements. Check readme for more info.
EOF
    exit 0
fi

echo "Starting server..."
uvicorn main:app --port $PORT --reload