# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm and native build tools needed for compilation
RUN npm install -g pnpm \
    && apk add --no-cache python3 make g++

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code and build the production assets
COPY . .
RUN pnpm run build


# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy the completely built application from the builder stage
# (This ensures no build tools like python/make/g++ bloat the final image)
COPY --from=builder /app .

# Expose the production preview port and Rindle daemon ports
EXPOSE 3000 7600 7601

# Run the production preview server instead of the dev server
CMD ["pnpm", "run", "preview"]
