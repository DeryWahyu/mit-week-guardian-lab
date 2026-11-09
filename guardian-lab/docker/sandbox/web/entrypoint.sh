#!/usr/bin/env bash
set -eu
remaining=$(( GUARDIAN_EXPIRES_AT - $(date +%s) ))
if [ "$remaining" -le 0 ] || [ "$remaining" -gt 180 ]; then exit 1; fi
python3 /guardian-quarantine.py &
guardian_watcher_pid=$!
for guardian_attempt in $(seq 1 50); do
  kill -0 "$guardian_watcher_pid" || exit 1
  if [ -f "$HOME/Downloads/.guardian-quarantine/index.json" ]; then break; fi
  sleep 0.1
done
test -f "$HOME/Downloads/.guardian-quarantine/index.json" || exit 1
exec timeout --signal=TERM --kill-after=3s "${remaining}s" /dockerstartup/kasm_default_profile.sh /dockerstartup/vnc_startup.sh /dockerstartup/kasm_startup.sh --wait
