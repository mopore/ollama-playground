import OpenAI from "openai";
import imgb64 from "image-to-base64";

/**
 * Provide a data url for the given file path.
 * Makes use of Bun built-in functionality
*/
const fileToDataUrl = async (path: string): Promise<string> => {
  const f = Bun.file(path);
  const mimeType = f.type || "application/octet-stream";
  const buf = await f.arrayBuffer();
  const b64 = Buffer.from(buf).toBase64();
  const dataUrl = `data:${mimeType};base64,${b64}`;
  return dataUrl;
}

const main = async () => {
  const client = new OpenAI({
    apiKey: "ollama",
    baseURL: "http://localhost:11434/v1"
  });


  const prompt = "Answer with 'YES' or 'NO' if an animal is present in the image.";

  const imageUrl = await fileToDataUrl("./image0.png"); // picture w/ fly
  // const imageUrl = await fileToDataUrl("./image1.jpg");  // just a landscape

  console.log("Checking if the image has an animal...");

  const resp = await client.chat.completions.create({
    model: "llava",
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
  });

  const respondedContent = resp.choices[0].message?.content?.trim();
  console.log(respondedContent);
}

await main();
