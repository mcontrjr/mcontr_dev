#!/bin/bash

SHOW_HELP=false
PORT=8000

setup() {
    echo "Setting up venv..."
    python3 -m venv venv
    source venv/bin/activate
    pip install --no-cache-dir -r requirements.txt
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