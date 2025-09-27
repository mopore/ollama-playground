import OpenAI from "openai";
import imgb64 from "image-to-base64";

const client = new OpenAI({
  apiKey: "ollama",
  baseURL: "http://localhost:11434/v1"
});


const prompt = "Answer with 'YES' or 'NO' if an animal is present in the image.";


const imageFile = await imgb64("./image0.png");
const imageUrl = `data:image/png;base64,${imageFile}`;

console.log("Checking if the image with the fly has an animal...");

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

console.log(resp.choices[0].message?.content?.trim());
