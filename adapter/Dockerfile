#----------------------------------------------------------#
# First stage: base image for further building and testing #
#----------------------------------------------------------#
FROM node:16-alpine as base

WORKDIR /build

# Copy package*.json files first in order to make best use of docker layer caching
COPY ./package*.json ./

# npm clean slate install to get reproducible builds and quicker installs
RUN npm ci

# copy rest of the files
COPY ./src ./src
COPY ./tsconfig.json ./
COPY ./*.js ./

#--------------------------------------------------------#
# Second stage: image to build and test node application #
#--------------------------------------------------------#
FROM base as build

# lint project
#RUN npm run lint-ci

# build
RUN npm run transpile

# run unit test
RUN npm run test

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
