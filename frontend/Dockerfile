FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Build standalone output
RUN npm run build

EXPOSE 3000

# IMPORTANT: standalone start (NOT `next start`)
CMD ["node", ".next/standalone/server.js"]
