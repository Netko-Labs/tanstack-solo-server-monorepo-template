FROM oven/bun:latest

WORKDIR /app

# Copy everything from monorepo
COPY . .

# Install dependencies
RUN bun install --frozen-lockfile

# Build the web app
WORKDIR /app/apps/web
RUN bun run build

# Copy entrypoint script
COPY apps/web/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Run migrations and start server
ENTRYPOINT ["docker-entrypoint.sh"]
