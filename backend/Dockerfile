FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p /app/data /app/logs /app/uploads

EXPOSE 3001

CMD ["node", "server.js"]
