#########################################################
# First stage: image to build and test Java application #
#########################################################
FROM adoptopenjdk/openjdk12-openj9:alpine-slim as builder

WORKDIR /builder
COPY *.gradle /builder/
COPY src /builder/src
COPY gradle /builder/gradle
COPY gradlew /builder/gradlew

# Build project and run unit tests
RUN ./gradlew assemble
RUN ./gradlew test

#########################################################
# Second stage: image to run Java application           #
#########################################################
FROM adoptopenjdk/openjdk12-openj9:alpine-slim

RUN mkdir /app
WORKDIR /app

# Pull the dist files from the builder container
COPY --from=builder /builder/build/libs/* app.jar

# Run app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]