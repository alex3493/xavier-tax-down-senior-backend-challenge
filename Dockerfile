FROM node:alpine AS dev-image

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package*.json .

RUN npm ci

COPY . .

CMD ["npm", "run", "devExpress"]

FROM node:alpine AS prod-image

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package*.json .

RUN npm ci

COPY . .

CMD ["npm", "run", "build"]

CMD ["npm", "run", "startExpress"]

