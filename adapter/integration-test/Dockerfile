FROM node:12-alpine

COPY . .
RUN npm ci

EXPOSE 8080

CMD [ "npm", "run", "test" ]
