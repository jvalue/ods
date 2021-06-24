FROM node:16-alpine

COPY ./package*.json ./
RUN npm ci

COPY ./.eslintrc.json ./
COPY ./src ./src

RUN npm run lint-ci

EXPOSE 8080

CMD [ "npm", "run", "test" ]
