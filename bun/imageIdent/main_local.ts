import {Ollama} from 'ollama';
import imgb64 from 'image-to-base64';

// LOCALHOST = "localhost" as const;
// ARC_VM_HOST_WG_IP = "10.200.0.2" as const; // IP of wg.PdJniRegainer
// ARC_VM_HOST_HOME_IP = 192.168.199.183
// ARC_VM_INTERNAL_IP = "192.168.68.2" as const;
// JNIMACSTUDIO_IP = "10.200.0.11" as const;  // IP of wg.jnimacstudio
//
const ollama = new Ollama({host:"10.200.0.2"});

// const ollama = new Ollama({host:"192.168.199.246"});
// const prompt = "Describe this image in one sentence.";
const prompt = "Answer with 'YES' or 'NO' if an animal is present in the image.";
const image = await imgb64("./image0.png");

console.log("Checkging if the image with the fly has an animal...");
const output = await ollama.generate({
  prompt: prompt,
  model: "llava",
  images: [image],
  // keep_alive: -1, // Keep the session alive indefinitely
  options: {
    temperature: 0,
  },
});

console.log(output.response);
