#!/bin/sh
set -e

echo "🚀 Starting forum application..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until nc -z postgres 5432; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy || echo "⚠️  Migrations may have already been applied"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Seed the database
echo "🌱 Seeding the database..."
npm run db:seed || echo "⚠️  Database may already be seeded"

echo "🎉 Database setup complete!"

# Start the application
echo "🌐 Starting Next.js development server..."
exec npm run dev
