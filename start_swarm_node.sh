#!/usr/bin/env bash

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <data-directory>"
  exit 1
fi

DATADIR="$1"

if [[ ! -e $DATADIR/keystore ]]; then
    mkdir -p $DATADIR
    echo 'secret' > $DATADIR/password
    /app/bin/geth --datadir $DATADIR account new --password $DATADIR/password
fi

KEY=$(jq --raw-output '.address' $DATADIR/keystore/*)

/app/bin/swarm \
    --datadir $DATADIR \
    --password $DATADIR/password \
    --verbosity 4 \
    --bzzaccount $KEY \
    --httpaddr 0.0.0.0 \
    --nat none \
    --corsdomain "*" \
    --nodiscover
