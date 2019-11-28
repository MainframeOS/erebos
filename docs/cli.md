---
title: Command-line interface
sidebar_label: CLI
---

## Installation

Node.js v10+ is required to run the CLI.

```sh
npm install --global @erebos/cli
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
- `--timeout` flag to set the requests timeout (in seconds), no timeout by default

## BZZ commands

> upload, download and list immutable resources - see the [official documentation](https://swarm-guide.readthedocs.io/en/latest/dapp_developer/index.html#uploading-and-downloading)

### bzz:hash

**Arguments**

1. ENS address (required)

**Example**

```sh
erebos bzz:hash theswarm.eth
```

### bzz:list

**Arguments**

1. manifest hash or ENS address (required)

**Flags**

- `--path`: file or folder to list contents of (optional, defaults to root)

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
- `--pin`: pin the uploaded resource

**Example**

```sh
erebos bzz:upload ./test
```

## Pin commands

> add, remove and list pinned resources - see the [official documentation](https://swarm-guide.readthedocs.io/en/latest/dapp_developer/index.html#pinning-content)

### pin:add

**Arguments**

1. resource hash (required)

**Flags**

- `--download`: download the resource before trying to pin it - useful if the resource is not already stored on the node
- `--raw`: set if the hash identifies a raw resource (single file with no manifest)

**Example**

```sh
erebos pin:add 1fa02eab3a58fca347e17b49476a6a19c42187cf4c17452944d7878809938139
```

### pin:remove

**Arguments**

1. resource hash (required)

**Example**

```sh
erebos pin:remove 1fa02eab3a58fca347e17b49476a6a19c42187cf4c17452944d7878809938139
```

### pin:list

**Example**

```sh
erebos pin:list
```

## Feed commands

> get and set mutable resources using immutable references - see the [official documentation](https://swarm-guide.readthedocs.io/en/latest/dapp_developer/index.html#feeds)

### feed:user

Displays the user address for the given private key, or creates a new private key if not provided.

**Flags**

- `--key-env`: name of the environment variable containing an already created private key (optional, a new key will be created when not provided)

**Example**

```sh
erebos feed:user --key-env=MY_KEY
```

### feed:set

Sets the value of the feed chunk

**Arguments**

1. chunk value (required)

**Flags**

- `--key-env`: name of the environment variable containing the private key for the feed (required)
- `--name`: feed name (optional)

**Example**

```sh
erebos feed:set --key-env=MY_KEY --name=test "hello world"
```

### feed:get

Displays the value of the feed chunk

**Flags**

- `--hash`: feed hash (required if `--user` is not provided)
- `--user`: feed user (required if `--hash` is not provided)
- `--name`: feed name (optional, only relevant if `--user` is provided)
- `--type`: content type to parse, possible options are:
  - `text` (default) for plain text contents
  - `json` for JSON data
  - `hash` if the chunk references a Swarm hash

**Example**

```sh
erebos feed:get --hash=1fa02eab3a58fca347e17b49476a6a19c42187cf4c17452944d7878809938139 --type=json
```

### feed:manifest

Creates a feed manifest and displays its hash

**Arguments**

1. user address (required)

**Flags**

- `--name`: feed name (optional)
- `--topic`: feed topic (optional)

**Example**

```sh
erebos feed:manifest 0x9a13f677a40459d8a49597eec0838191b4d74ec5 --name=test
```

## Timeline commands

> a feed-based singly-linked list - [learn more](timeline-spec.md)

### timeline:create

Creates a new timeline using the provided private key or creating a new one

**Arguments**

1. first chapter contents (required - JSON by default unless the `--type` flag is set otherwise)

**Flags**

- `--key-env`: name of the environment variable containing an already created private key (optional, a new key will be created when not provided)
- `--name`: feed name (optional)
- `--type`: type of the chapter `content` field (optional, defaults to `application/json`)
- `--manifest`: if provided, creates a feed manifest and displays its hash

**Example**

```sh
erebos timeline:create --key-env=MY_KEY --name=json '{"hello":"world"}'
erebos timeline:create --key-env=MY_KEY --name=text --type="text/plain" "hello world"
```

### timeline:add

Adds a new chapter to an existing timeline using the provided private key

**Arguments**

1. new chapter contents (required - JSON by default unless the `--type` flag is set otherwise)

**Flags**

- `--key-env`: name of the environment variable containing an already created private key (required)
- `--name`: feed name (optional)
- `--type`: type of the chapter `content` field (optional, defaults to `application/json`)

**Example**

```sh
erebos timeline:add --key-env=MY_KEY --name=json '{"hello":"timeline"}'
```

### timeline:lookup

Retrieves the latest chapter ID of the given timeline

**Flags**

- `--hash`: feed hash (required if `--user` is not provided)
- `--user`: feed user (required if `--hash` is not provided)
- `--name`: feed name (optional, only relevant if `--user` is provided)

**Example**

```sh
erebos timeline:lookup --user=0x9a13f677a40459d8a49597eec0838191b4d74ec5 --name=test
```

### timeline:read

Retrieves the chapter with the provided `--chapter` ID, or the latest chapter of the given timeline

**Flags**

- `--hash`: feed hash (required if `--user` is not provided)
- `--user`: feed user (required if `--hash` is not provided)
- `--name`: feed name (optional, only relevant if `--user` is provided)
- `--chapter`: chapter ID (optional, latest chapter ID by default)

```sh
erebos timeline:read --user=0x9a13f677a40459d8a49597eec0838191b4d74ec5 --chapter=1fa02eab3a58fca347e17b49476a6a19c42187cf4c17452944d7878809938139
```

## Website commands

> setup and publish static websites

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

## PSS commands

> UDP-like messaging - see the [official documentation](https://swarm-guide.readthedocs.io/en/latest/dapp_developer/index.html#swarm-messaging-for-dapp-developers)

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

Displays the 4-byte hexadecimal topic for a given string.

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
