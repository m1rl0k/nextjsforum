#!/bin/bash
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until PGPASSWORD=password psql -h localhost -U user -d forum -c '\q'; do
  >&2 echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

# Run database migrations
echo "Running database migrations..."
cd /app
npx prisma migrate deploy --preview-feature

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Seed the database
echo "Seeding the database..."
npx ts-node prisma/seed.ts

echo "Database initialization complete!"
