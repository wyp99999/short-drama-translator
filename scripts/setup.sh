#!/bin/bash
# Setup script for Short Drama Translator

echo "Setting up Short Drama Translator..."

# Create directories
mkdir -p backend/data backend/logs backend/uploads
mkdir -p frontend/dist

# Setup backend
cd backend
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env file from template"
fi

npm install
node database/init.js

cd ../frontend
npm install

echo "Setup complete!"
echo "Run './scripts/start.sh' to start the application."
