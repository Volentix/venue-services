FROM node:8-alpine

ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

COPY package.json .

RUN npm install --production

COPY . .

EXPOSE 8080

CMD ["npm", "start"]