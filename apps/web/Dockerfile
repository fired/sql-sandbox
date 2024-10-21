FROM node:20-alpine

WORKDIR /app

# Declare the build argument
ARG NEXT_PUBLIC_SERVER_URL
ARG RESEND_API_KEY

# Pass the build argument to the environment
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}
ENV RESEND_API_KEY=${RESEND_API_KEY}


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
