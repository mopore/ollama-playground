import { ChromaClient, Collection } from "chromadb";
import {Ollama} from "ollama";

const MY_COL_NAME = "my-collection";
const OLLAMA_HOST_IP = "192.168.199.246";
const EMBEDDING_MODEL = "nomic-embed-text";
const LLM_MODEL = "llama3:70b";
const MAX_TOP_RESULTS = 5;

const INPUT_SEARCH = "Where did Jens Nixdorf went to school?";

const readyDatabase = async ():Promise<Collection> => {
  const client = new ChromaClient({ path: "localhost:8000",});
  const collection = await client.getCollection({name:MY_COL_NAME});
  console.log("ChromaDB collection is ready.");
  return collection;
}

const main = async (): Promise<void> => {
  console.log(`Trying to answer the question: "${INPUT_SEARCH}"`);
  const collection = await readyDatabase();

  const ollama = new Ollama({host:OLLAMA_HOST_IP});
  console.log("Creating query embedding to search in ChromaDB...");
  const queryEmbed = (await ollama.embeddings({
    model: EMBEDDING_MODEL, prompt: INPUT_SEARCH
  })).embedding;

  console.log("Searching ChromaDB for relevant documents...");
  const relevantDocs = (await collection.query({
    queryEmbeddings: [queryEmbed],
    nResults: MAX_TOP_RESULTS,
  })).documents[0].join("\n\n");

  console.log("Creating prompt for LLM with additional context from ChromaDB...");
  const modelQuery = `${INPUT_SEARCH} - 
Answer that question using the following text as a resourse: ${relevantDocs}`;

  console.log(`Asking "${LLM_MODEL}" to answer the question...`);
  const stream = await ollama.generate({
    model: LLM_MODEL,
    prompt: modelQuery,
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.response);
  }
}

await main();
