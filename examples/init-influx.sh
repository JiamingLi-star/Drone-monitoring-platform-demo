#!/usr/bin/env bash
set -euo pipefail

if [ -f /docker-entrypoint-initdb.d/sample-lineprotocol.lp ]; then
  influx write \
    --org "$INFLUXDB_INIT_ORG" \
    --bucket "$INFLUXDB_INIT_BUCKET" \
    --precision=ns \
    --token "$INFLUXDB_INIT_ADMIN_TOKEN" \
    /docker-entrypoint-initdb.d/sample-lineprotocol.lp || true
fi
