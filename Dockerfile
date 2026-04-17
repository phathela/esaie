# Root Dockerfile — builds and starts the Next.js frontend.
# The backend has its own Dockerfile at backend/Dockerfile.
# On Railway: set up two separate services, each pointing to their subdirectory.
FROM node:20-alpine

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "node .next/standalone/server.js"]
