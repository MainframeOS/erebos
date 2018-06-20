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

which jq
if [ $? -eq 0 ]
then
    KEY=$(jq --raw-output '.address' $DATADIR/keystore/*)
else
    printf "\n\nERROR: jq is required to run the startup script\n\n"
    exit 1
fi

/app/bin/swarm \
    --datadir $DATADIR \
    --password $DATADIR/password \
    --verbosity 4 \
    --bzzaccount $KEY \
    --ens-api '' \
    --bzznetworkid 922 \
    --httpaddr 0.0.0.0 \
    --ws \
    --wsorigins '*'

