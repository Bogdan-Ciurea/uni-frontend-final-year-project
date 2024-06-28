# Use official Node.js v14 image as the base
FROM node:14-alpine

# Create a working directory for the application
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files to the container
# COPY .env.local ./
COPY . .

# Build the application
RUN npm run build

# Set the environment variable to production
ENV NODE_ENV production
ENV COOKIE_PASSWORD "b23d989a2c7e33ea3f8752bff062a9c6da2bf75e314451153f18ddf09be57175"
ENV BACKEND_HOSTNAME "host.docker.internal"
ENV BACKEND_PORT "8080"
ENV NEXT_PUBLIC_BACKEND_URL "http://$BACKEND_HOSTNAME:$BACKEND_PORT"
ENV BACKEND_URL "http://$BACKEND_HOSTNAME:$BACKEND_PORT"

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
