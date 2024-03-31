import {Ollama} from 'ollama';
import imgb64 from 'image-to-base64';

const MAC_STUDIO_IP = "192.168.199.246" as const;

const VERDICT_SCHEMA = {
  verdictResult: {
    "type": "boolean",
    "description": "Is true if the verdict is positive, false if negative",
  },
} as const;


type Verdict = {
  verdictResult: boolean;
}


const checkImageForAnimalAsync = async (imagePath: string): Promise<string> => {
  const ollama = new Ollama({host:MAC_STUDIO_IP});
  const prompt = "Answer with 'YES' or 'NO' if an animal displayed in the image.";
  const image = await imgb64(imagePath);

  const output = await ollama.generate({
    prompt: prompt,
    model: "llava",
    images: [image],
    keep_alive: -1, // Keep the session alive indefinitely
    options: {
      temperature: 0,
    },
  });
  return output.response;
}


const verdictAsync = async (text: string): Promise<boolean> => {
  const ollama = new Ollama({host:MAC_STUDIO_IP});
  const output = await ollama.chat({
    // model: "llama2:70b",
    model: "llama2",
    keep_alive: -1, // Keep the session alive indefinitely
    format: "json",
    options: {
      temperature: 0,
    },
    messages: [
      {
        role: "system",
        content: `The user will give a text string representing a verdict. Identify if the verdict is positive or negative. Output as JSON using this schema: ${JSON.stringify(VERDICT_SCHEMA, null, 2)}`,
      },
      {
        role: "user",
        content: "No",
      },
      {
        role: "assistant",
        content: "{\n\"verdictResult\": false }",
      },
      {
        role: "user",
        content: "YES",
      },
      {
        role: "assistant",
        content: "{\n\"verdictResult\": true }",
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  const content = output.message.content;
  const verdict = JSON.parse(content) as Verdict;
  return verdict.verdictResult;
}


const main = async ():Promise<void> => {
  const imageData = [
    ["fly", "./image0.png"],
    ["car", "./image1.jpg"],
    ["nature", "./image2.png"],
    ["snake", "./image3.png"],
    ["monkey", "./image4.png"],
  ];

  for (const [animal, image] of imageData) {
    console.log(`Checking for animal: ${animal}`);
    const result = await checkImageForAnimalAsync(image);
    const verdict = await verdictAsync(result);
    console.log(`Verdict: ${verdict}`);
  }
}

await main();
