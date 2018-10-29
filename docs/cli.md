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

## Commands

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
