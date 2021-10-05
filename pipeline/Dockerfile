#----------------------------------------------------------#
# First stage: base image for further building and testing #
#----------------------------------------------------------#
FROM node:16-alpine as base

# install dependencies for pact (https://docs.pact.io/docker/)
RUN apk add --no-cache --virtual build-dependencies build-base
RUN apk --no-cache add ca-certificates wget bash \
  && wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub \
  && wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.29-r0/glibc-2.29-r0.apk \
  && apk add glibc-2.29-r0.apk

WORKDIR /build

# Copy package*.json files first in order to make best use of docker layer caching
COPY ./package*.json ./

# npm clean slate install to get reproducible builds and quicker installs
RUN npm ci

# copy rest of the files
COPY ./src ./src
COPY ./tsconfig.json ./
<<<<<<< HEAD
COPY ./*.js ./
=======
COPY ./.eslintrc.js ./
COPY ./jest.config.js ./
>>>>>>> 8fdc1c1034ba7493b5f5fca2d4b5e374667bd433

# lint project
RUN npm run lint-ci

#-----------------------------------------------#
# Second stage: image to build node application #
#-----------------------------------------------#
FROM base as build

# build
RUN npm run transpile

#--------------------------------------------#
# Third stage: image to run node application #
#--------------------------------------------#
FROM node:16-alpine

WORKDIR /app

COPY --from=build /build/dist/ ./dist/
COPY --from=build /build/package*.json ./

RUN npm ci --only=production
EXPOSE 8080

CMD [ "npm", "run", "start:transpiled" ]
