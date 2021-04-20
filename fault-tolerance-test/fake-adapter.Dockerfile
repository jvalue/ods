FROM node:14-alpine

COPY ./package*.json ./
RUN npm ci --only=production

COPY ./src ./src

EXPOSE 8080

CMD [ "npm", "run", "fake-adapter" ]
