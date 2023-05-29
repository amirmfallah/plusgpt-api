FROM node:19-alpine
WORKDIR /usr/src/app
COPY docker.env .env
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD [ "node", "server/index.js" ]