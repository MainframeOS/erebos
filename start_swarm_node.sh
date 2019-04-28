#!/bin/sh

echo $PASSWORD > /password

if [[ ! -e $DATADIR/keystore ]]; then
    mkdir -p $DATADIR
    /geth --datadir $DATADIR account new --password /password
fi


BZZ_KEY=`/geth account list --datadir $DATADIR | sed "s/.*{\(.*\)}.*/\1/1"`

/swarm \
    --datadir $DATADIR \
    --password /password \
    --verbosity 4 \
    --bzzaccount $BZZ_KEY \
    --httpaddr 0.0.0.0 \
    --nat none \
    --corsdomain "*" \
    --ws \
    --wsaddr 0.0.0.0 \
    --wsorigins "*"
