FROM node:lts-alpine

# copy package*.json files first to make best use of docker layer caching
COPY ./package*.json ./

# run npm clean slate install
RUN npm ci

# copy rest of the files
COPY ./src ./src

EXPOSE 8080

CMD [ "npm", "run", "test" ]
