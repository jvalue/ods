#-------------------------------------------------------#
# First stage: image to build and test node application #
#-------------------------------------------------------#
FROM node:14-alpine as build-stage

WORKDIR /build

# Copy package*.json files first in order to make best use of docker layer caching
COPY ./package*.json ./

# npm clean slate install to get reproducible builds and quicker installs
RUN npm ci

# copy rest of the files
COPY ./tsconfig.json ./
COPY ./.eslintrc.js ./
COPY ./src ./src

# lint project
RUN npm run lint-ci

# build and test
RUN npm run transpile

#---------------------------------------------#
# Second stage: image to run node application #
#---------------------------------------------#
FROM node:14-alpine

WORKDIR /app

COPY --from=build-stage /build/dist/ ./dist/
COPY --from=build-stage /build/package*.json ./

RUN npm ci --only=production
EXPOSE 8080

CMD [ "npm", "run", "start:transpiled" ]
