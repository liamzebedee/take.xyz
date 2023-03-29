#!/bin/bash
set -ex

# Define the tmux session and pane IDs
SESSION_NAME="my_session"
PANE_ID="0"

tmux capture-pane -e -p -S - -E - -t my_session:0.0 > output.txt

# Kill the session
tmux kill-session -t my_session:0.0

less -g output.txt