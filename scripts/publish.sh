#!/bin/sh

set -e

pnpm install

pnpm run build

cp README.md ./vue3-gantt-chart/

cd vue3-gantt-chart

npm publish


