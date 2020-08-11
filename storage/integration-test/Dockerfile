FROM node:lts-alpine

COPY ./src ./src
COPY ./package*.json ./
COPY ./.eslintrc* ./

RUN npm ci
RUN npm run lint

EXPOSE 8080

CMD [ "npm", "run", "test" ]
