FROM ubuntu:20.04 as build

MAINTAINER SDF Ops Team <ops@stellar.org>

RUN mkdir -p /app
RUN apt-get update && apt-get install -y gnupg1

WORKDIR /app

ARG REACT_APP_AMPLITUDE_KEY

ENV REACT_APP_AMPLITUDE_KEY $REACT_APP_AMPLITUDE_KEY

ARG REACT_APP_SENTRY_KEY

ENV REACT_APP_SENTRY_KEY $REACT_APP_SENTRY_KEY

RUN apt-get update && apt-get install -y gnupg curl git make apt-transport-https && \
    curl -sSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - && \
    echo "deb https://deb.nodesource.com/node_14.x focal main" | tee /etc/apt/sources.list.d/nodesource.list && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install -y nodejs yarn && apt-get clean


COPY . /app/
RUN yarn install
RUN yarn build

FROM nginx:1.17

COPY --from=build /app/build/ /usr/share/nginx/html/
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf
