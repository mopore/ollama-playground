import {Ollama} from 'ollama';
import imgb64 from 'image-to-base64';

const imagePath = "./image0.png" as const;
const ollama = new Ollama({host:"192.168.199.246"});
// const prompt = "Describe this image in one sentence.";
const prompt = "Answer with 'YES' or 'NO' if an animal is present in the image.";
const image = await imgb64(imagePath);

console.log(`Checking if an animal is present in the image (${imagePath})...`);
const output = await ollama.generate({
  prompt: prompt,
  model: "llava",
  images: [image],
  keep_alive: -1, // Keep the session alive indefinitely
  options: {
    temperature: 0,
  },
});

console.log(output.response);
