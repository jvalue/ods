FROM node:lts-alpine

ARG UI_BASE_URL
ARG AUTH_SERVICE_URL
ARG CORE_SERVICE_URL
ARG STORAGE_SERVICE_URL
ARG TRANSFORMATION_SERVICE_URL

WORKDIR /build
COPY ./src ./src
COPY ./public ./public
COPY ./*.js ./
COPY ./*.json ./

RUN echo "VUE_APP_BASE_URL=$UI_BASE_URL" > .env \
    && echo "VUE_APP_AUTH_SERVICE_URL=$AUTH_SERVICE_URL" >> .env \
    && echo "VUE_APP_CORE_SERVICE_URL=$CORE_SERVICE_URL" >> .env \
    && echo "VUE_APP_STORAGE_SERVICE_URL=$STORAGE_SERVICE_URL" >> .env \
    && echo "VUE_APP_TRANSFORMATION_SERVICE_URL=$TRANSFORMATION_SERVICE_URL" >> .env \
    && cat .env

RUN npm install

CMD [ "npm", "run", "serve" ]
