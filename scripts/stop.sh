#!/bin/bash
# Stop script

cd "$(dirname "$0")/.."

echo "Stopping Short Drama Translator..."

if command -v docker-compose &> /dev/null; then
  docker-compose down
  echo "Docker containers stopped"
else
  # Kill local processes if running
  if [ -f .backend.pid ]; then
    kill $(cat .backend.pid) 2>/dev/null
    rm .backend.pid
  fi
  if [ -f .frontend.pid ]; then
    kill $(cat .frontend.pid) 2>/dev/null
    rm .frontend.pid
  fi
  echo "Local processes stopped"
fi

echo "Application stopped"
