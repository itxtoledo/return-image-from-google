# Multi-stage build: first stage for building the application
FROM node:22.11-slim AS builder

# Install pnpm
RUN npm install -g pnpm

# Set the working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build the TypeScript code
RUN pnpm run build

# Second stage: use the official Puppeteer image
FROM ghcr.io/puppeteer/puppeteer:latest

# Switch to root to install pnpm
USER root

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory
WORKDIR /app

# Change ownership of the working directory to pptruser
RUN chown pptruser:pptruser /app

# Switch back to pptruser
USER pptruser

# Copy built files from the builder stage
COPY --from=builder --chown=pptruser:pptruser /app/dist ./dist
COPY --from=builder --chown=pptruser:pptruser /app/package.json .
COPY --from=builder --chown=pptruser:pptruser /app/pnpm-lock.yaml .

# Install only production dependencies
RUN pnpm install --prod

# Command to run the application
CMD ["pnpm", "start"]