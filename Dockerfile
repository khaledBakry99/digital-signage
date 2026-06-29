# ============================================
# Multi-stage Dockerfile for Digital Signage
# ============================================

# Stage 1: Builder
# This stage installs dependencies and builds the Next.js application
FROM node:20-alpine AS builder

# Set working directory inside the container
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
# Using npm ci (clean install) instead of npm install for reproducible builds in CI/CD
RUN npm ci

# Copy the entire project source code
COPY . .

# Build the Next.js application
# This creates the optimized production build in the .next directory
RUN npm run build

# ============================================
# Stage 2: Runtime
# This stage runs the application with minimal footprint
# ============================================
FROM node:20-alpine

# Set working directory for the runtime container
WORKDIR /app

# Copy package files from builder (needed for runtime dependencies)
COPY package*.json ./

# Install only production dependencies
# Omit devDependencies like vitest, typescript, tailwindcss, etc.
RUN npm ci --omit=dev

# Copy the built application from the builder stage
COPY --from=builder /app/.next ./.next

# Copy public assets directory (contains static files like SVGs)
COPY public ./public

# ============================================
# Environment Configuration
# ============================================

# Set NODE_ENV to production for optimized performance
ENV NODE_ENV=production

# Expose port 3000 where Next.js runs
EXPOSE 3000

# Configure health check for container orchestration systems (Docker, Kubernetes)
# This checks if the application is responding to requests
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# ============================================
# Startup Command
# ============================================

# Start the Next.js production server
# This runs the compiled application with optimized performance
CMD ["npm", "start"]

# ============================================
# Usage Instructions:
# ============================================
# 
# Build the Docker image:
#   docker build -t digital-signage:latest .
#
# Run the container locally:
#   docker run -p 3000:3000 digital-signage:latest
#
# Run with environment variables:
#   docker run -p 3000:3000 -e NODE_ENV=production digital-signage:latest
#
# Run in detached mode (background):
#   docker run -d -p 3000:3000 --name signage-app digital-signage:latest
#
# View container logs:
#   docker logs signage-app
#
# Stop the container:
#   docker stop signage-app
#
# Remove the container:
#   docker rm signage-app
#
# Docker Compose usage (see docker-compose.yml):
#   docker-compose up -d
#   docker-compose down
#
# ============================================
