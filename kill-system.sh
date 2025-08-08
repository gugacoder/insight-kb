#!/bin/bash

# This script kills any application listening on ports 3000 or 8000.

echo "Attempting to kill processes on ports 3000 and 8000..."
fuser -k 3000/tcp 8000/tcp
echo "Done."
