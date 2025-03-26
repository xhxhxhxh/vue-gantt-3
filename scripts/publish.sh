#!/bin/sh

set -e

pnpm install

pnpm run build

cp README.md ./vue-gantt-3/

cd vue-gantt-3

npm publish


