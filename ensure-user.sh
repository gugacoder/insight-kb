#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define user credentials
EMAIL="guga.coder@gmail.com"
NAME="Guga Coder"
USERNAME="gugacoder"
PASSWORD="local"

# Change to the project root directory to run npm commands
cd /home/coder/insight-kb

# Delete the user
echo "Deleting user: $EMAIL"
npm run delete-user -- "$EMAIL"

# Create the user
echo "Creating user: $EMAIL"
npm run create-user -- "$EMAIL" "$NAME" "$USERNAME" "$PASSWORD"

echo "User ensured successfully."
