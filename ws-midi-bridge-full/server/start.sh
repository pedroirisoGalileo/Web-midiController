#!/usr/bin/env bash
set -e
PORT="${PORT:-8080}"
MODE="${MODE:-virtual}"  # virtual | out
OUT_NAME="${OUT_NAME:-IAC Driver Bus 1}"
TOKEN="${WS_TOKEN:-}"

npm install
if [[ -n "$TOKEN" ]]; then export WS_TOKEN="$TOKEN"; fi

if [[ "$MODE" == "virtual" ]]; then
  echo "Iniciando en modo VIRTUAL en :$PORT"
  node server.js --port "$PORT" --virtual
else
  echo "Iniciando apuntando a salida: $OUT_NAME en :$PORT"
  node server.js --port "$PORT" --out "$OUT_NAME"
fi
