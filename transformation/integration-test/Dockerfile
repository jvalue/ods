FROM node:lts-alpine as builder

COPY ./package*.json ./
RUN npm ci

COPY ./.eslintrc ./
COPY ./src ./src

RUN npm run lint

EXPOSE 8080

CMD [ "npm", "run", "test" ]
