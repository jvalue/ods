# First stage: image to build and test node application
FROM node:lts-alpine as builder

WORKDIR /build
COPY ./src ./src
COPY ./package*.json ./
COPY ./tsconfig.json ./
COPY ./.eslint* ./
COPY ./jest.config.js ./

# Install dependencies and run build
RUN npm ci
RUN npm run lint-ci
RUN npm run transpile
RUN npm run test

# Second stage: image to run node application
FROM node:lts-alpine

RUN mkdir /app
WORKDIR /app

COPY --from=builder /build/dist/ ./dist/
COPY --from=builder /build/package*.json ./

RUN npm ci --only=production
EXPOSE 8080

CMD [ "npm", "run", "start:transpiled" ]
