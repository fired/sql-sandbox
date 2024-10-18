FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

# Ensure Next.js listens on all interfaces
ENV HOST 0.0.0.0

CMD ["npm", "start"]