#
# you can build the image with:
#
#   docker build . -t e2e

FROM node:10-jessie
RUN npm install -g yarn

COPY . clientlib
WORKDIR clientlib
RUN yarn install --frozen-lockfile
ENV RELAY_HOSTNAME relay
CMD ["yarn", "test:e2e"]
