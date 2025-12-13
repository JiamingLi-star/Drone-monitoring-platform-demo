#!/usr/bin/env bash
set -euo pipefail

PORT=${PORT:-3000}
HOST=${HOST:-localhost}

curl -v \
  -X POST \
  -H "Content-Type: application/json" \
  --data @examples/telemetry.json \
  "http://${HOST}:${PORT}/api/v1/uas/telemetry"
