#!/bin/sh
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h localhost -U user -d forum; do
  sleep 1
done

# Run database migrations
echo "Running database migrations..."
npx prisma migrate dev --name init --preview-feature

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "Database initialization complete!"
