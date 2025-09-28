Initialize with:
```shell
# 1) Initialize (note protocolVersion) and capture the session id
SID=$(
  curl -si http://127.0.0.1:8080/mcp/ \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' \
    -d '{
      "jsonrpc":"2.0",
      "id":1,
      "method":"initialize",
      "params":{
        "protocolVersion":"2025-03-26",
        "clientInfo":{"name":"curl","version":"0.0.0"},
        "capabilities":{}
      }
    }' \
  | awk 'BEGIN{IGNORECASE=1} tolower($1)=="mcp-session-id:" {print $2}' \
  | tr -d "\r"
)
echo "mcp-session-id: $SID"
```

Echo the initialization:
```shell
# 2) (Recommended by spec) send the 'initialized' notification
curl -sS http://127.0.0.1:8080/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H "mcp-session-id: $SID" \
  -d '{
    "jsonrpc":"2.0",
    "method":"notifications/initialized",
    "params":{}
  }'
```

Call the tool:
```shell
# 3) Call the tool
curl -sS http://127.0.0.1:8080/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H "mcp-session-id: $SID" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{ "name":"add_numbers", "arguments":{"a":5,"b":9} }
  }'
```

Read a resource:
```shell
# 4) Read the "hello world" resource
curl -sS http://127.0.0.1:8080/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H "mcp-session-id: $SID" \
  -d '{
    "jsonrpc":"2.0",
    "id":3,
    "method":"resources/read",
    "params":{"uri":"local://hello"}
  }'
```
