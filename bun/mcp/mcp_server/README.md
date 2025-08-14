Example for an MCP Server running with HTTP Streaming
=====================================================

To run with Bun from the Bun Docker image set an alias
```shell
alias bun="docker run --name bun-temp-runner --interactive --tty --rm --network host -v $(pwd):/app -w /app oven/bun bun"
```

Execute with:
```shell
bun server.ts
```

To stop the server, run:
```shell
docker container stop bun-temp-runner
```

To test the tool call:
```shell
curl -sS http://localhost:8080/mcp \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' \
    -d '{
        "jsonrpc":"2.0",
        "id":2,
        "method":"tools/call",
        "params": {
            "name":"add_numbers",
            "arguments":{"a":2,"b":2}
        }
    }'
```
List available tools:
```
curl -sS http://localhost:8080/mcp \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' \
    -d '{
        "jsonrpc":"2.0",
        "id":1,
        "method":"tools/list"
        "params":{}
    }'
```

Run the server from a Docker container
```shell
docker build -t mcp-server-example-add-numbers .
docker compose up -d
```


*** Note *** When using n8n running inside a container you have to give an external IP for localhost.

