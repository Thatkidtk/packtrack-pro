FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# App runs on 3000
EXPOSE 3000

# Environment defaults (can be overridden by Fly secrets)
ENV NODE_ENV=production \
    DB_DIR=/data \
    DB_FILE=packtrack.db \
    DB_PATH=/data/packtrack.db \
    COOKIE_SECURE=true

CMD ["node", "server.js"]

