FROM node:18-alpine

RUN apk add --no-cache openssl

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .

CMD ["sh", "-c", "npx prisma generate || true; npm run dev"]