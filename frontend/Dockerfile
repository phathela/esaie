FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Railway will set $PORT at runtime
CMD ["sh", "-c", "echo PORT=$PORT && echo HOSTNAME=$HOSTNAME && HOSTNAME=0.0.0.0 PORT=${PORT:-8080} node .next/standalone/server.js"]
