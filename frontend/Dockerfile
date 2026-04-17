FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Copy static assets into the standalone output — required for Next.js standalone mode
RUN cp -r .next/static .next/standalone/.next/static && \
    cp -r public .next/standalone/public 2>/dev/null || true

EXPOSE 8080

CMD ["sh", "-c", "cd /app/.next/standalone && HOSTNAME=0.0.0.0 PORT=${PORT:-8080} node server.js"]
