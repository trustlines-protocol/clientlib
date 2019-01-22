#
# you can build the image with:
#
#   docker build . -t e2e

FROM node:10-jessie as builder
RUN npm install -g yarn

COPY . /clientlib
WORKDIR /clientlib

RUN yarn install --frozen-lockfile
FROM node:10-jessie-slim
COPY --from=builder /usr/local/bin/yarn /usr/local/bin/yarn
COPY --from=builder /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=builder /clientlib /clientlib

ENV RELAY_HOSTNAME relay
WORKDIR /clientlib
CMD ["yarn", "test:e2e"]
