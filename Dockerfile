FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
# Install only production deps for lean image
RUN npm ci --only=production

# Copy app source
COPY . .

# Ensure a writable directory exists (fallback; non-persistent)
RUN mkdir -p /tmp && mkdir -p /data || true

# App runs on 3000
EXPOSE 3000

# Environment defaults (can be overridden by Fly secrets)
ENV NODE_ENV=production \
    DB_DIR=/tmp \
    DB_FILE=packtrack.db \
    DB_PATH=/tmp/packtrack.db \
    COOKIE_SECURE=true

# Run init then start via npm (respects package.json)
CMD ["npm", "start"]
