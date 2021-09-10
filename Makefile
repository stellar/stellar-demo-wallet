# Check if we need to prepend docker commands with sudo
SUDO := $(shell docker version >/dev/null 2>&1 || echo "sudo")

# If LABEL is not provided set default value
LABEL ?= $(shell git rev-parse --short HEAD)$(and $(shell git status -s),-dirty-$(shell id -u -n))
# If TAG is not provided set default value
TAG ?= stellar/stellar-demo-wallet:$(LABEL)
# https://github.com/opencontainers/image-spec/blob/master/annotations.md
BUILD_DATE := $(shell date -u +%FT%TZ)

docker-build:
	$(SUDO) docker build --pull --label org.opencontainers.image.created="$(BUILD_DATE)" \
	--build-arg REACT_APP_AMPLITUDE_KEY=$(AMPLITUDE_KEY) --build-arg REACT_APP_SENTRY_KEY=$(SENTRY_KEY) -t $(TAG) .

docker-push:
	$(SUDO) docker push $(TAG)
