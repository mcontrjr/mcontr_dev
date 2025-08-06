#!/usr/bin/env bash

# This script is used to log the output of a tmux session to a file.

SESSION="logs"

# Check if the session already exists
tmux has-session -t $SESSION 2>/dev/null
if [ $? != 0 ]; then
    # Create a new session with the first pane running 'docker logs -f frontend'
    tmux new-session -d -s $SESSION "docker logs -f frontend"
    # Split the window horizontally and run 'docker logs -f server' in the second pane
    tmux split-window -h -t $SESSION "docker logs -f server"
fi

# Attach to the session
tmux attach -t $SESSION