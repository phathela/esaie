FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# NEXT_PUBLIC_* vars must be present at build time — declare as ARG so
# Railway can pass the service env var through during docker build.
ARG NEXT_PUBLIC_API_URL=https://esaie-production.up.railway.app
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Copy static assets into the standalone output (required for Next.js standalone mode)
RUN cp -r .next/static .next/standalone/.next/static && \
    cp -r public .next/standalone/public 2>/dev/null || true

EXPOSE 8080

CMD ["sh", "-c", "cd /app/.next/standalone && HOSTNAME=0.0.0.0 PORT=${PORT:-8080} node server.js"]
