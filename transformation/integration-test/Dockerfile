# First stage: Transpile typescript files to dist
FROM node:lts-alpine as builder

WORKDIR /build
COPY ./src ./src
COPY ./package*.json ./
COPY ./tsconfig.json ./

# Install dependencies and run build
RUN npm ci
RUN npm run transpile

# Second stage: image to run integration test
FROM node:lts-alpine

RUN mkdir /app
WORKDIR /app

COPY --from=builder /build/src/*.js ./
COPY --from=builder /build/dist/ ./
COPY ./package*.json ./


RUN npm ci

EXPOSE 8080

CMD [ "npm",  "run", "test" ]