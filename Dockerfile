# Use an official golang image for simplicity (and compilation)
FROM golang:1.10.3-stretch

RUN mkdir /app && mkdir /app/bin

# Set the working directory to /app
WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y jq

RUN git clone https://github.com/ethereum/go-ethereum.git

WORKDIR /app/go-ethereum

RUN git fetch origin && git checkout v1.8.20 # Swarm v0.3.8

RUN make geth
RUN make swarm

# back to the app directory
WORKDIR /app

# copy the built binaries to a convenient location
RUN cp /app/go-ethereum/build/bin/geth /app/bin/
RUN cp /app/go-ethereum/build/bin/swarm /app/bin/

# do not package the source code into the image
RUN rm -rf /app/go-ethereum/

# Copy script for starting swarm into the container
COPY ./start_swarm_node.sh /app
