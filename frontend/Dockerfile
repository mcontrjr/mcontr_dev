# Use Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build tools for native modules
RUN apk add --no-cache python3 make g++ gcc libc-dev

# Copy package files
COPY package*.json ./

# Remove @vitejs/plugin-react-swc and install @vitejs/plugin-react
RUN npm uninstall @vitejs/plugin-react-swc && \
    npm install @vitejs/plugin-react --save-dev && \
    npm install --platform=linuxmusl --arch=x64

# Copy application files
COPY . .

# Expose the server port (default Express port or from env)
EXPOSE 5173

# Command to run the server
CMD ["npm", "run", "dev"]