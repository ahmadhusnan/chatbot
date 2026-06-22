FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source code
COPY . .

# Expose the Fastify port
EXPOSE 3000

# Run with tsx for TypeScript execution
CMD ["npx", "tsx", "src/server.ts"]
