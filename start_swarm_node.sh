#!/bin/sh
docker run \
       --publish 8500:8500 \
       --publish 8546:8546 \
       --env DATADIR=/data \
       --env PASSWORD=password123 \
       --volume /tmp/swarm-data:/data \
       --interactive \
       --tty \
       "ethersphere/swarm:0.4.2" \
       --nosync \
       --maxpeers=0 \
       --verbosity=3 \
       --httpaddr=0.0.0.0 \
       --nat=none \
       --corsdomain="*" \
       --ws \
       --wsaddr=0.0.0.0 \
       --wsorigins="*"
