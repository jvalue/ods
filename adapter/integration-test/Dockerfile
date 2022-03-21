FROM node:14-alpine
# Note: Node 15 has problems shutting down mock servers (last checked: 2021-03-02)

COPY ./package*.json ./
RUN npm ci

COPY ./.eslintrc.json ./
COPY ./src ./src

#RUN npm run lint-ci

EXPOSE 8080

CMD [ "npm", "run", "test" ]
