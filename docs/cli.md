---
title: Command-line interface
sidebar_label: CLI
---

## Usage

```sh
erebos <command> [arguments and flags]
```

## Commands

### bzz:download

**Arguments**

1. hash or ENS address (required)

**Flags**

- `path`: folder to download contents to (optional, defaults to `./`)

**Example**

```sh
erebos bzz:download 1fa02eab3a58fca347e17b49476a6a19c42187cf4c17452944d7878809938139 --path=./test
```

### bzz:upload

**Arguments**

1. folder to download contents from (optional, defaults to `./`)

**Example**

```sh
erebos bzz:upload ./test
```
