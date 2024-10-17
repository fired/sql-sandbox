# Use an official Node runtime as the parent image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Create a directory for user databases
RUN mkdir user_dbs && chmod 777 user_dbs

# Expose the port the app runs on
EXPOSE 3001

# Define the command to run the app
CMD [ "node", "server.js" ]
