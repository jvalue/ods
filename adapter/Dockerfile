FROM adoptopenjdk/openjdk12-openj9:alpine-slim

COPY build/libs/*.jar app.jar

ENTRYPOINT ["java", "-jar", "/app.jar"]

EXPOSE 8080