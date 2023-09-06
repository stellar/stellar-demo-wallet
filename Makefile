# Check if we need to prepend docker commands with sudo
SUDO := $(shell docker version >/dev/null 2>&1 || echo "sudo")

# If LABEL is not provided set default value
LABEL ?= $(shell git rev-parse --short HEAD)$(and $(shell git status -s),-dirty-$(shell id -u -n))
# If TAG is not provided set default value
SERVER_TAG ?= stellar/stellar-demo-wallet-server:$(LABEL)
CLIENT_TAG ?= stellar/stellar-demo-wallet-client:$(LABEL)
# https://github.com/opencontainers/image-spec/blob/master/annotations.md
BUILD_DATE := $(shell date -u +%FT%TZ)

docker-build-server:
	$(SUDO) docker build -f Dockerfile-server --pull --label org.opencontainers.image.created="$(BUILD_DATE)" \
	-t $(SERVER_TAG) .

docker-push-server:
	$(SUDO) docker push $(SERVER_TAG)

docker-build-client:
	$(SUDO) docker build -f Dockerfile-client --pull --label org.opencontainers.image.created="$(BUILD_DATE)" \
	-t $(CLIENT_TAG) .

docker-push-client:
	$(SUDO) docker push $(CLIENT_TAG)
