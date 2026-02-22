#!/bin/bash
# Start script using Docker Compose

echo "Starting Short Drama Translator with Docker..."

cd "$(dirname "$0")/.."

if ! command -v docker-compose &> /dev/null; then
  echo "Error: docker-compose not found"
  echo "Please install Docker Compose first"
  exit 1
fi

docker-compose up -d

echo ""
echo "Services started!"
echo "Frontend:    http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo "Health:      http://localhost:3001/health"
echo ""
echo "View logs: docker-compose logs -f"
echo "Stop:      docker-compose down"
