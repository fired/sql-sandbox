FROM node:18-alpine

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies and rebuild SQLite3
RUN npm install
RUN npm rebuild sqlite3

# Copy the rest of the application code
COPY . .

EXPOSE 3001

CMD ["node", "server.js"]