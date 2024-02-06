FROM node:18 as build

MAINTAINER SDF Ops Team <ops@stellar.org>

WORKDIR /app

COPY . /app/

RUN yarn workspace demo-wallet-server install
RUN yarn build:shared
RUN yarn build:server

# Copy it all to a clean image to avoid cache artifacts elsewhere in the image

FROM node:18
COPY --from=build /app /app
WORKDIR /app

CMD ["yarn", "start:server"]
