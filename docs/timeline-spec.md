---
title: Timeline specification
---

## Purpose

The timeline specification describes a singly-linked list data structure allowing to iterate over individual items (named "chapters") in reverse chronological order.
It leverages [Swarm feeds](https://swarm-guide.readthedocs.io/en/latest/usage.html#feeds) in order to store and update the ID (Swarm hash) of the latest chapter, providing an immutable reference to retrieve the latest chapter of the timeline.

## Data structure

A chapter is a JSON object containing the following fields:

- `protocol`: required `string` with value `timeline`, used for sanity check when loading a chapter.
- `version`: required [valid SemVer `string`](https://semver.org/) with value `1.0.0`, the current version of the protocol.
- `timestamp`: required `integer`, the UNIX timestamp in milliseconds of the creation of the chapter.
- `author`: required hexadecimal `string`, the Ethereum address of the author (40 hexadecimal characters prefixed with `0x`).
- `type`: required `string`, the MIME type of the `content`.
- `content`: any valid JSON data satisfying the specified `type`.
- `previous`: hexadecimal `string`, the ID (Swarm hash) of the previous chapter. It is required unless the chapter is the first in the timeline.
- `references`: optional `array` of hexadecimal `string` representing the IDs (Swarm hashes) of related chapters in the given timeline.
- `signature`: optional hexadecimal `string` prefixed with `0x` of the signed chapter (JSON-serialised fields other than the `signature`).

In addition, once a chapter is downloaded and therefore its ID (Swarm hash) is know, it should be set as the `id` field in the chapter structure.

## Implementation flows

### Creating a timeline

1. Create a first chapter by uploading its JSON to Swarm, the returned Swarm hash of the content is the `chapter ID`.
1. Update the wanted Swarm feed with the value of the created `chapter ID`.

### Loading a known timeline chapter

1. Load the chapter JSON using its `chapter ID` (Swarm hash).
1. Inject the know `chapter ID` in the `id` field of the loaded JSON structure.

### Loading the latest timeline chapter

1. Retrieve the latest chapter `chapter ID` from the Swarm feed.
1. Load the chapter JSON using its `chapter ID` (Swarm hash).
1. Inject the know `chapter ID` in the `id` field of the loaded JSON structure.

### Adding a chapter to a timeline

1. Retrieve the latest chapter `chapter ID` from the Swarm feed.
1. Create the chapter JSON structure with the retrieved `chapter ID` injected in the `previous` field.
1. Upload the chapter JSON to Swarm, the returned Swarm hash of the content is the `new chapter ID`.
1. Update the Swarm feed with the value of the created `new chapter ID`.
