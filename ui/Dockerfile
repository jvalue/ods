# First stage: image to build and test node application
FROM node:lts-alpine

ARG AUTH_SERVICE_URL
ARG TRANSFORMATION_SERVICE_URL

WORKDIR /build
COPY . .

RUN echo "VUE_APP_AUTH_SERVICE_URL=$AUTH_SERVICE_URL" >> .env
RUN echo "VUE_APP_TRANSFORMATION_SERVICE_URL=$TRANSFORMATION_SERVICE_URL" >> .env
RUN cat .env

CMD [ "npm", "run", "serve" ]