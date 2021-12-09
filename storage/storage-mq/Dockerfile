#----------------------------------------------------------#
# First stage: base image for further building and testing #
#----------------------------------------------------------#
FROM node:15-alpine as base

# install dependencies for pact (https://docs.pact.io/docker/)
RUN apk add --no-cache --virtual build-dependencies build-base
RUN apk --no-cache add ca-certificates wget bash \
  && wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub \
  && wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.29-r0/glibc-2.29-r0.apk \
  && apk add glibc-2.29-r0.apk

WORKDIR /build

# Copy package*.json files first, then run install, in order to make best use of docker layer caching
COPY ./package*.json ./

# npm clean slate install to get reproducible builds and quicker installs
RUN npm ci

# copy rest of the files
COPY ./tsconfig.json ./
COPY ./.eslintrc.js ./
COPY ./*.js ./
COPY ./src ./src

#--------------------------------------------------------#
# Second stage: image to build and test node application #
#--------------------------------------------------------#
FROM base as builder

# lint project
RUN npm run lint-ci

# build
RUN npm run transpile

# run unit test
RUN npm run test

#--------------------------------------------#
# Third stage: image to run node application #
#--------------------------------------------#
FROM node:15-alpine

RUN mkdir /app
WORKDIR /app

COPY --from=builder /build/dist/ ./dist/
COPY --from=builder /build/package*.json ./

RUN npm ci --only=production

EXPOSE 8080

CMD [ "npm", "run", "start:transpiled" ]
