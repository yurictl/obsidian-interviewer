#!/bin/bash

# Build the plugin
echo "Building plugin..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build successful!"

    # Copy files to vault
    VAULT_PATH="/Users/yura/Documents/obsidian-interviewer/.obsidian/plugins/obsidian-interviewer"

    echo "Copying files to vault: $VAULT_PATH"
    mkdir -p "$VAULT_PATH"
    cp main.js manifest.json styles.css "$VAULT_PATH/"

    echo "Deployment complete!"
else
    echo "Build failed!"
    exit 1
fi
