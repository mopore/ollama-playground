```
  ___  _ _                       
 / _ \| | | __ _ _ __ ___   __ _ 
| | | | | |/ _` | '_ ` _ \ / _` |
| |_| | | | (_| | | | | | | (_| |
 \___/|_|_|\__,_|_| |_| |_|\__,_|
                                 
 ____  _                                             _ 
|  _ \| | __ _ _   _  __ _ _ __ ___  _   _ _ __   __| |
| |_) | |/ _` | | | |/ _` | '__/ _ \| | | | '_ \ / _` |
|  __/| | (_| | |_| | (_| | | | (_) | |_| | | | | (_| |
|_|   |_|\__,_|\__, |\__, |_|  \___/ \__,_|_| |_|\__,_|
               |___/ |___/                             
```

# Ollama Playground
Playground to test the API for Ollama with Bun.

## Prerequisites
Ensure to have Ollama, Docker and Bun installed.

## Image Identification w/ JSON Schema
`bun/imageIdent` uses the `llava` model to identify whether or not an animal 
is present in an image (`main.ts`). 
Additionally in `main_json.ts` the resulting answer is also converted with a 
JSON schema.

## RAG Example
This is an example to answer a question with additional context provided from
a vector database. See the corresponding `bun/rag/README.md` for more details.
