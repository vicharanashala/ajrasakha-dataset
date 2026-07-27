# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files for backend
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci

# Copy backend source code
COPY backend/src ./src
COPY backend/tsconfig.build.json ./
COPY backend/tsconfig.json ./
COPY backend/nest-cli.json ./

# Build backend
RUN npm run build

# Build frontend - copy from root context
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/vite.config.ts ./
COPY frontend/tsconfig.json ./
COPY frontend/public ./public
RUN npm run build

# Go back to backend directory for final image
WORKDIR /app

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built backend from builder
COPY --from=builder /app/dist ./dist

# Copy built frontend from builder
COPY --from=builder /app/frontend/dist ./frontend/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Change ownership of app directory
RUN chown -R nestjs:nestjs /app
USER nestjs

# Set port (Cloud Run uses PORT env var, default to 8080)
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the application with explicit port
CMD ["sh", "-c", "node dist/main"]