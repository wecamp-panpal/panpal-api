FROM node:20

WORKDIR /app

COPY package.json ./package.json
COPY package-lock.json ./package-lock.json

RUN npm install -g @nestjs/cli && npm install

COPY . .

RUN npm run build

CMD ["node", "dist/main"]
