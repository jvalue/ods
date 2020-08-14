#-------------------------------------------------------#
# First stage: image to build and test node application #
#-------------------------------------------------------#
FROM node:lts-alpine as builder

WORKDIR /build

# Build time env vars
ARG MAX_TRIGGER_RETRIES
ENV MAX_TRIGGER_RETRIES=$MAX_TRIGGER_RETRIES
ARG ADAPTER_SERVICE_URL
ENV ADAPTER_SERVICE_URL=$ADAPTER_SERVICE_URL
ARG INITIAL_CONNECTION_RETRIES
ENV INITIAL_CONNECTION_RETRIES=$INITIAL_CONNECTION_RETRIES
ARG INITIAL_CONNECTION_RETRY_BACKOFF
ENV INITIAL_CONNECTION_RETRY_BACKOFF=$INITIAL_CONNECTION_RETRY_BACKOFF

# Copy package*.json files first, then run install, in order to make best use of docker layer caching
COPY ./package*.json ./

# npm clean slate install to get reproducible builds and quicker installs
RUN npm ci

# copy rest of the files
COPY ./src ./src
COPY ./tsconfig.json ./
COPY ./jest.config.js ./
COPY ./.eslintrc ./

# lint project
RUN npm run lint-ci

# build and test
RUN npm run transpile
RUN npm run test

#---------------------------------------------#
# Second stage: image to run node application #
#---------------------------------------------#
FROM node:lts-alpine

RUN mkdir /app
WORKDIR /app

COPY --from=builder /build/dist/ ./dist/
COPY --from=builder /build/package*.json ./

RUN npm ci --only=production

EXPOSE 8080

CMD [ "npm", "run", "start:transpiled" ]
