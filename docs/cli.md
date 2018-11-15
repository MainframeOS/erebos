---
title: Command-line interface
sidebar_label: CLI
---

## Installation

Node.js v10+ is required to run the CLI.

```sh
npm install -g @erebos/cli
```

## Usage

```sh
erebos <command> [arguments and flags]
```

## Configuration

In order to connect to the relevant Swarm node, the Erebos CLI uses the following optional environment variables and flags in each command. The flags take priority over environment variables.

- `--http-gateway` flag or `EREBOS_HTTP_GATEWAY` environment variable, defaults to `http://localhost:8500`
- `--ipc-path` flag or `EREBOS_IPC_PATH` environment variable, no default
- `--ws-url` flag or `EREBOS_WS_URL` environment variable, defaults to `ws://localhost:8546`

## BZZ commands

### bzz:hash

**Arguments**

1. ENS address (required)

**Example**

```sh
erebos bzz:hash theswarm.eth
```

### bzz:list

**Arguments**

1. hash or ENS address (required)

**Example**

```sh
erebos bzz:list 1fa02eab3a58fca347e17b49476a6a19c42187cf4c17452944d7878809938139
```

### bzz:download

**Arguments**

1. hash or ENS address (required)

**Flags**

- `--path=./`: file or folder to download contents to (optional, defaults to `./`)
- `--raw`: to download a raw resource (single file with no manifest)

**Example**

```sh
erebos bzz:download 1fa02eab3a58fca347e17b49476a6a19c42187cf4c17452944d7878809938139 --path=./test
```

### bzz:upload

**Arguments**

1. file or folder to upload contents from (optional, defaults to `./`)

**Flags**

- `--content-type`: content-type header when uploading a single file, if not set the file will be uploaded in raw mode
- `--default-path`: path of the default entry when resolving the manifest root

**Example**

```sh
erebos bzz:upload ./test
```

## PSS commands

### pss:address

Displays the node base address.

**Example**

```sh
erebos pss:address
```

### pss:key

Displays the node public key.

**Example**

```sh
erebos pss:key
```

### pss:topic

**Arguments**

1. topic string

**Example**

```sh
erebos pss:topic "hello pss"
```

### pss:listen

Listens and displays incoming messages in the provided topic.

**Arguments**

1. topic string or hex value

**Example**

```sh
erebos pss:listen test
```

### pss:send

Sends a single message using the provided flags.

**Arguments**

1. message to send

**Flags**

- `--address=0x`: peer node address (optional, defaults to `0x`)
- `--key`: peer public key
- `--topic`: topic string or hex value

**Example**

```sh
erebos pss:send --key=0x... --topic=test "Hello there!"
```

### pss:peer

Opens a [Node.js REPL](https://nodejs.org/dist/latest-v10.x/docs/api/repl.html) allowing to send and receive messages from a peer.

**Arguments**

1. peer public key

**Flags**

- `--address=0x`: peer node address (optional, defaults to `0x`)
- `--topic`: topic string or hex value (optional, defaults to `0xaecc1868`)

**Example**

```sh
erebos pss:peer 0x... --topic=hello
```

## Website commands

### website:setup

Creates a new Swarm feed manifest that will provide an immutable hash for the website.

**Flags**

- `--key-env`: name of the environment variable containing an already created private key (optional, a new key will be created when not provided)
- `--name`: feed name (optional)
- `--topic`: feed topic (optional)

**Example**

```sh
erebos website:setup --name="awesome website"
```

### website:publish

Publishes website contents using the provided contents folder, manifest hash and corresponding private key.\
The root `index.html` file in the contents folder will be used as the default entry.

**Arguments**

1. path to the website contents folder to upload

**Flags**

- `--hash`: feed manifest hash generated using the `website:setup` command
- `--key-env`: name of the environment variable containing the private key associated to the feed manifest

**Example**

```sh
MY_KEY=... erebos website:publish --hash=... --key-env=MY_KEY ./build
```
