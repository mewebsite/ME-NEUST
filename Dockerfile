FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package info
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy source code (excluding items in .dockerignore)
COPY . .

# Ensure standard Node.js security best practices
USER node

# Expose the standard port (Cloud Run will provide PORT env var)
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
