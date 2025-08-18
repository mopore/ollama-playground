  ___  _ _                         _____           _ 
 / _ \| | | __ _ _ __ ___   __ _  |_   _|__   ___ | |
| | | | | |/ _` | '_ ` _ \ / _` |   | |/ _ \ / _ \| |
| |_| | | | (_| | | | | | | (_| |   | | (_) | (_) | |
 \___/|_|_|\__,_|_| |_| |_|\__,_|   |_|\___/ \___/|_|
                                                     
  ____      _ _ _                       __  __  ____ ____  
 / ___|__ _| | (_)_ __   __ _     _    |  \/  |/ ___|  _ \ 
| |   / _` | | | | '_ \ / _` |  _| |_  | |\/| | |   | |_) |
| |__| (_| | | | | | | | (_| | |_   _| | |  | | |___|  __/ 
 \____\__,_|_|_|_|_| |_|\__, |   |_|   |_|  |_|\____|_|    
                        |___/                              

## Overview

This project is based on "tool_calling" (sister directory) and a first
MCP attempt.

This client will only work with a running MCP server that can be called.
The server can be started directly via the server.ts script or can be run
as a docker container.

The server can be tested with CURL commands which are proviced here:
[Curl commands to test MCP server](./Curl_statements_to_test_server.md)

## Setup

To install dependencies:
```shell
bun install
```

To test:
```shell
bun test
```

To run without mcp only via Ollama tool calling:
```shell
bun run src/ollama/main.ts -t "Add 200 and 1"
# or
# bun run src/ollama/main.ts -t "Make a note to go to the toilet"
```

To run the MCP server:
```shell
bun run src/server/main.ts
```

To call via MCP client:
```shell
bun run src/client/main.ts -t "Add 200 and 1"  # triggers add numbers tool
# or
# bun run src/client/main.ts -t "Make a note 'Buy new coffee'"  # triggers make note tool
```

Docker setup
```shell
docker buildx build -t mcp-server-example .
docker compose up -d
```

