FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Railway will set $PORT at runtime
EXPOSE 8080

CMD ["sh", "-c", "export HOSTNAME=0.0.0.0; export PORT=${PORT:-8080}; node .next/standalone/server.js"]
