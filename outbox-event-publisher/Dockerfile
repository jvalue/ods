#-------------------------------------------------------#
# First stage: image to build the application           #
#-------------------------------------------------------#
# The gradle version here should match the gradle version in gradle/wrapper/gradle-wrapper.properties
FROM gradle:6.7-jdk15-openj9 as builder

WORKDIR /builder

# Copy project files
COPY *.gradle /builder/
COPY src /builder/src

# Build the project
RUN gradle installDist

#-------------------------------------------------------#
# Second stage: image to run the application            #
#-------------------------------------------------------#
FROM adoptopenjdk/openjdk15-openj9:alpine-slim

RUN mkdir /app
WORKDIR /app

# Pull the dist files from the builder container
COPY --from=builder /builder/build/install/ .

# Run app
ENTRYPOINT ["./outbox-event-publisher/bin/outbox-event-publisher"]
