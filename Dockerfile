# Copyright 2020 Google LLC. All rights reserved.
# Use of this source code is governed by the Apache 2.0
# license that can be found in the LICENSE file.

# [START cloudrun_pubsub_dockerfile]
# [START run_pubsub_dockerfile]

# Use the official lightweight Node.js 12 image.
# https://hub.docker.com/_/node
FROM node:18

RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm

# Create and change to the app directory.
WORKDIR /usr/src/app

COPY package.json ./

ADD . ./
RUN pnpm install

RUN pnpm run build

EXPOSE 8080

ENV NODE_ENV production

# Run the web service on container startup.
CMD [ "pnpm", "start" ]

# [END run_pubsub_dockerfile]
# [END cloudrun_pubsub_dockerfile]
