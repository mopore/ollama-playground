```
 ____      _    ____   _____                           _      
|  _ \    / \  / ___| | ____|_  ____ _ _ __ ___  _ __ | | ___ 
| |_) |  / _ \| |  _  |  _| \ \/ / _` | '_ ` _ \| '_ \| |/ _ \
|  _ <  / ___ \ |_| | | |___ >  < (_| | | | | | | |_) | |  __/
|_| \_\/_/   \_\____| |_____/_/\_\__,_|_| |_| |_| .__/|_|\___|
                                                |_|           
```
An Example for a RAG application using Bun.
Source: https://www.youtube.com/watch?v=8rz9axIzIy4

With this example one can ask questions to an LLM which can only be answered
with the knowledge of the content of the text file `./specific_input.txt`.

To solution is the following:
The knowledge will be converted into embeddings to be stored in a vector 
database (ChromaDB). The giving question will be also converted into an
embedding. This "search embedding" will be used to query for the most similar
embeddings in the database. The corresponding text content will be used to
compile a prompt containing the original question and the additional context 
retrieved from the vector database search.
The result is then streamed to the console.

We use "sentencize" as a library to split the text content into sentences.
A sentence is a chunk which then can be embedded.

For embedding we use "nomic-embed-text" from Ollama which needs to be pulled
before used via the API `ollama pull nomic-embed-text`.

For the LLM model to answer the actual question we use "llama3:70b" which
also needs to be pulled `ollama pull llama3:70b`.
The model is running remotely on a home server (if not changed in the code).


# Chroma Vector Database Setup
As a database for vector embeddings with search we use Chroma
https://www.trychroma.com/

We can setup the choma database with the following command:
```shell
chroma run --host localhost --port 8000 --path ./my_local_data
```

Alternatively use the provided docker compose file `docker compose up -d`.

The base for the docker-comose.yaml was provided via chroma's git repo:
```shell
wget https://raw.githubusercontent.com/chroma-core/chroma/main/docker-compose.yml

```
Note:
I needed to change the network entry and define the image "chromadb/chroma".
Also since we do not reuse the storage I removed the volume entry.


# Running the Example
- Ensure to have bun, docker and docker compose installed.
- Run the chroma database as described above.
- Install the bun dependencies: `bun install`
- Feed the database with `bun feed.ts`
- Run the search example with `bun searct.ts`
