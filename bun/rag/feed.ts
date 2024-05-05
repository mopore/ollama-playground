import { ChromaClient, Collection } from "chromadb";
import { chunkTextBySentences } from "matts-llm-tools";
import {Ollama} from "ollama";

const MY_COL_NAME = "my-collection";
const EMBEDDING_MODEL = "nomic-embed-text";
const OLLAMA_HOST_IP = "192.168.199.246";

const inputDocs: string[] = [
  "specific_input.txt",
] as const;

const readyDatabase = async ():Promise<Collection> => {
  const client = new ChromaClient({ path: "localhost:8000",});
  await client.deleteCollection({name:MY_COL_NAME});
  const collection = await client.getOrCreateCollection({name:MY_COL_NAME});
  console.log("ChromaDB collection is ready.");
  return collection;
}


const main = async (): Promise<void> => {
  const collection = await readyDatabase();
  for (const doc of inputDocs) {
    console.log(`Embedding chunks from "${doc}"`);
    const text = await Bun.file(doc).text();
    const chunks = chunkTextBySentences(text, 7, 2);
    const ollama = new Ollama({host:OLLAMA_HOST_IP});
    for await (const [index, chunk] of chunks.entries()) {
      const embedding = (await ollama.embeddings({
        model:EMBEDDING_MODEL,
        prompt: chunk,
      })).embedding;
      await collection.add({
        ids: [doc + index],
        embeddings: [embedding],
        metadatas: { source: doc },
        documents: [chunk],
      });
      process.stdout.write(".");
    }
  }
  console.log("\nDone!");
}

await main();
