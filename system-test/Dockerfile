FROM node:lts-alpine as builder

COPY ./src ./src
COPY ./package*.json ./
RUN npm install

EXPOSE 8080

CMD [ "npm", "run", "test" ]
