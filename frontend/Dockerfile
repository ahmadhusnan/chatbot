FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source code
COPY . .

# Expose the Vite dev server port
EXPOSE 5173

# Run Vite dev server bound to 0.0.0.0 so it's accessible outside the container
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]
