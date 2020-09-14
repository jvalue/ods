FROM node:lts-alpine as builder

COPY ./src ./src
COPY ./package*.json ./
COPY ./.eslint* ./

RUN npm ci
RUN npm run lint-ci

EXPOSE 8080

CMD [ "npm", "run", "test" ]
