#!/bin/sh
mkdir -p /tmp/swarm/data && \
echo "password" > /tmp/swarm/password && \
docker run $@ \
  --publish 8500:8500 \
  --publish 8546:8546 \
  --volume /tmp/swarm:/swarm \
  --interactive \
  --tty \
  "ethersphere/swarm:0.4.3" \
    --datadir /swarm/data \
    --password /swarm/password \
    --nosync \
    --maxpeers=0 \
    --verbosity=4 \
    --httpaddr=0.0.0.0 \
    --nat=none \
    --corsdomain="*" \
    --ws \
    --wsaddr=0.0.0.0 \
    --wsorigins="*"
