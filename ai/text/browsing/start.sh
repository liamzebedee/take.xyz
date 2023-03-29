#!/bin/bash
set -ex

# Define the tmux session and pane IDs
# SESSION_NAME="my_session"
# PANE_ID="0"

COLS=236
# LINES=220
LINES=130

# Create a detached tmux session named "my_session"
tmux new-session -d -s my_session -x $COLS -y $LINES

# Run the "echo" command in the session
export CMD="docker run -e COLUMNS=$COLS -e LINES=$LINES -ti fathyb/carbonyl https://www.woolworths.com.au/shop/search/products\?searchTerm\=asparagus"

tmux send-keys -t my_session "$CMD" Enter
