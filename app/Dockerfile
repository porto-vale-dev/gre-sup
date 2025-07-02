# Dockerfile for Next.js with Standalone Output

# Stage 1: Base image with dependencies
FROM node:20-slim AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install --production=false

# Stage 2: Builder
FROM base AS builder
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 3: Final image
FROM node:20-slim AS final

# Create a non-root user and group for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy the standalone Next.js app from the builder stage with correct ownership
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Copy the public folder from the builder stage with correct ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set the user to the non-root user
USER nextjs

# Expose the port the app will run on
EXPOSE 3000

# Set environment variables
# The PORT will be overridden by Cloud Run, but this is a good default
ENV PORT 3000
# Ensure the server listens on all interfaces, crucial for containerized environments
ENV HOSTNAME 0.0.0.0

# Command to run the application
# This starts the standalone Next.js server
CMD ["node", "server.js"]
