FROM node:20-alpine

WORKDIR /app

# Declare the build argument
ARG NEXT_PUBLIC_SERVER_URL

# Pass the build argument to the environment
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all other files
COPY . .

# Build the Next.js app
RUN npm run build

# Ensure Next.js listens on all interfaces
CMD ["npm", "start"]
