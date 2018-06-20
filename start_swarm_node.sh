#!/usr/bin/env bash

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <data-directory>"
  exit 1
fi

GIT_TAG="swarm-network-rewrite"
DATADIR="$1"
SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"
EXT_DEPS_DIR="$SCRIPTPATH/external_deps"
GODIR="$EXT_DEPS_DIR/go-ethereum"

mkdir -p "$EXT_DEPS_DIR"

if [[ ! -e $GODIR ]]; then
    echo "cloning the go-ethereum repo"
    cd "$EXT_DEPS_DIR"
    git clone --depth 1 https://github.com/MainframeHQ/go-ethereum.git -b $GIT_TAG
fi

cd "$GODIR"
# doing the fetch here and now makes sure that we can change the chosen
# commit hash without the risk of breaking the script
git fetch --depth 1 origin $GIT_TAG
git checkout $GIT_TAG
make geth
make swarm

if [[ ! -e $DATADIR/keystore ]]; then
  mkdir -p $DATADIR
  echo 'secret' > $DATADIR/password
  $GODIR/build/bin/geth --datadir $DATADIR account new --password $DATADIR/password
fi

which jq
if [ $? -eq 0 ]
then
    KEY=$(jq --raw-output '.address' $DATADIR/keystore/*)
else
    printf "\n\nERROR: jq is required to run the startup script\n\n"
    exit 1
fi

$GODIR/build/bin/swarm \
    --datadir $DATADIR \
    --password $DATADIR/password \
    --verbosity 4 \
    --bzzaccount $KEY \
    --ens-api '' \
    --bzznetworkid 922 \
    --httpaddr 0.0.0.0 \
    --ws \
    --wsorigins '*'

