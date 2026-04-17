FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Railway will provide PORT at runtime (often 8080)
EXPOSE 3000

CMD ["sh", "-c", "PORT=${PORT:-3000} node .next/standalone/server.js"]
