FROM node:18-alpine
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN if [ -f "./prisma/schema.prisma" ]; then npx prisma generate; fi
CMD ["npm", "run", "dev"]