SHELL := /bin/bash

.PHONY: show-args init-ci build test release-ci epilogue-ci testbreak-after

show-args:
	@echo "[show-args] branch=$${SEMAPHORE_GIT_BRANCH:-local} commit=$${SEMAPHORE_GIT_SHA:-local}"

init-ci:
	npm ci

build:
	npm run build

test:
	@if npm run 2>/dev/null | grep -q " test"; then \
		npm test; \
	else \
		echo "[test] no test script defined, skipping"; \
	fi

release-ci:
	@echo "[release-ci] no-op"

epilogue-ci:
	@echo "[epilogue-ci] done"

testbreak-after:
	@echo "[testbreak-after] no-op"
