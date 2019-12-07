FROM node:10-alpine

WORKDIR /contribe-api

COPY package*.json .npmrc ./

RUN npm ci

ARG NODE_ENV
ARG PORT
ARG COMMIT_HASH

ENV NODE_ENV=$NODE_ENV \
    PORT=$PORT \
    COMMIT_HASH=$COMMIT_HASH

COPY . .

RUN npm run build

EXPOSE $PORT

CMD ["npm", "start"]
