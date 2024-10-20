FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all other files
COPY . .

# Build the Next.js app
RUN npm run build

# Ensure Next.js listens on all interfaces
CMD ["npm", "start", "-H", "0.0.0.0"]
