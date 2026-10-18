#!/bin/sh
# STOKKU standalone launcher untuk Pterodactyl.
# Pakai port yang dialokasikan panel (SERVER_PORT); fallback 3000.
export NODE_ENV=production
export HOSTNAME=0.0.0.0
export PORT="${SERVER_PORT:-${PORT:-3000}}"
echo "[start.sh] listening on 0.0.0.0:${PORT}"
exec node server.js
