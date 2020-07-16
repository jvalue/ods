FROM node:lts-alpine

COPY ./src ./src
COPY ./package*.json ./
RUN npm ci

EXPOSE 8080

CMD [ "npm", "run", "test" ]
