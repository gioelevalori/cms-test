#!/usr/bin/env bash
# Esegue un comando in CI; se fallisce, pubblica le ultime righe dell'output come annotazione di errore.
name="$1"; shift
log=$(mktemp)
"$@" 2>&1 | tee "$log"
code=${PIPESTATUS[0]}
if [ "$code" -ne 0 ]; then
  msg=$(tail -n 60 "$log" | sed 's/\x1b\[[0-9;]*m//g' | sed ':a;N;$!ba;s/%/%25/g;s/\r//g;s/\n/%0A/g')
  echo "::error title=${name}::${msg}"
fi
exit "$code"
