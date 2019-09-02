---
title: RPC clients, handler and transport
---

## JSON-RPC

Erebos provides tools to communicate using [JSON-RPC 2.0](https://www.jsonrpc.org/specification) as used by Ethereum and Swarm.
Multiple libraries support various purposes, such as:

- [Transports](#transports): the communication layer between a client and server
- [Core libraries](#core-libraries): foundation utilities implementing the [JSON-RPC 2.0 specification](https://www.jsonrpc.org/specification)
- [Clients](#clients) for various environments
- A server-side [handler](rpc-handler.md) helper to process incoming requests

## Transports

- [HTTP](transport-http.md) for Node and browsers
- [WebSocket](transport-ws.md) for Node and browsers
- [IPC](transport-ipc.md) for Node
- [Electron](transport-electron.md) for Electron's renderer process

## Core libraries

- [Error class and utilities](rpc-error.md)
- [Abstract client class](rpc-base.md)
- [Stateless client class](rpc-request.md)
- [Stateful client class](rpc-stream.md)

## Clients

- [HTTP client](rpc-http.md) for Node and browsers
- [WebSocket client](rpc-ws.md) for Node and browsers
- [IPC client](rpc-ipc.md) for Node
- [Browser client](rpc-browser.md) over [HTTP](transport-http.md) or [WebSocket](transport-ws.md)
- [Node client](rpc-node.md) over [HTTP](transport-http.md), [WebSocket](transport-ws.md) or [IPC](transport-ipc.md)
- [Electron client](rpc-electron.md) for Electron's renderer process
