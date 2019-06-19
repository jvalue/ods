# First stage: image to build and test java application
FROM adoptopenjdk/openjdk12-openj9:alpine-slim as builder

WORKDIR /builder
COPY . .

# Install dependencies and run build
RUN ./gradlew assemble
RUN ./gradlew test 

# Second stage: image to run node application
FROM adoptopenjdk/openjdk12-openj9:alpine-slim

RUN mkdir /app
WORKDIR /app

# Pull the dist files from the builder container
COPY --from=builder /builder/build/libs/* app.jar

# Run app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]