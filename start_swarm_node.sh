#!/bin/sh
docker run \
       --publish 8500:8500 \
       --publish 8546:8546 \
       --env DATADIR=/data \
       --env PASSWORD=password123 \
       --volume /tmp/swarm-data:/data \
       --network host \
       --interactive \
       --tty \
       "ethdevops/swarm:v0.3.11" \
       --nosync \
       --maxpeers=0 \
       --verbosity=4 \
       --httpaddr=0.0.0.0 \
       --nat=none \
       --corsdomain=* \
       --ws \
       --wsaddr=0.0.0.0 \
       --wsorigins=*
