# Build stage
FROM node:20-bullseye AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    sqlite3 \
    libsqlite3-dev

WORKDIR /build

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies, including devDependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build better-sqlite3 from source
RUN npm rebuild better-sqlite3 --build-from-source

# Runtime stage
FROM node:20-bullseye-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    sqlite3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built better-sqlite3 module and other necessary files from builder stage
COPY --from=builder /build/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /build/database.js ./
COPY --from=builder /build/server.js ./
COPY --from=builder /build/sql ./sql

EXPOSE 3001

CMD ["node", "server.js"]