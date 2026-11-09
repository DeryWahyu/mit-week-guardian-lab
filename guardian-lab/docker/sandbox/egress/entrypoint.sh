#!/bin/sh
set -eu
remaining=$(( GUARDIAN_EXPIRES_AT - $(date +%s) ))
if [ "$remaining" -le 0 ] || [ "$remaining" -gt 180 ]; then exit 1; fi
exec timeout --signal=TERM --kill-after=3s "${remaining}s" squid -N -f /etc/squid/squid.conf
