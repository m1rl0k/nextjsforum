FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Set environment variables
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .


# Generate Prisma client
RUN npx prisma generate

# Expose the port
EXPOSE 3000

# Run the application in development mode
CMD ["npm", "run", "dev"]
