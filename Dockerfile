FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package configurations
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Temporarily install native build tools (for better-sqlite3), install packages, and then clean up tools to save space
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && pnpm install --frozen-lockfile \
    && apk del .build-deps

# Copy the rest of the application code
COPY . .

# Expose Vite dev port and Rindle daemon ports
EXPOSE 3000 7600 7601

# The default command runs the development server
CMD ["pnpm", "run", "dev"]
