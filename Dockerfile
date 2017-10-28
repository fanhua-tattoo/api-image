FROM node:alpine


ENV IMAGE_LIBRARY_ROOT /images

RUN mkdir -p /app
VOLUME $IMAGE_LIBRARY_ROOT
COPY package.json /app/
RUN yarn --production && \
    yarn cache clean
COPY . /app

CMD ["node", "src/index.js"]
