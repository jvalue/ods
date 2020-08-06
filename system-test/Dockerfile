FROM node:lts-alpine

# copy package*.json files first to make best use of docker layer caching
COPY ./package*.json ./
COPY ./.eslintrc.json ./
COPY ./src ./src

# run npm clean slate install
RUN npm ci

# lint
RUN npm run lint-ci

EXPOSE 8080

CMD [ "npm", "run", "test" ]
