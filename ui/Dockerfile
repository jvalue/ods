# First stage: image to build node application
FROM node:lts-alpine as builder

WORKDIR /build
COPY . .

# Install dependencies and run build
RUN npm install
RUN npm run build

# Second stage: image to run node application
FROM node:lts-alpine

# Install simple http server for serving static content
RUN npm install -g http-server

RUN mkdir /app
WORKDIR /app

# Pull the dist files from the builder container
COPY --from=builder /build/dist .

# Run app
EXPOSE 8080
CMD [ "http-server", "." ]