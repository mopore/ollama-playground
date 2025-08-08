import {checkEnv, processArgs, readVersion} from "./shared/helpers.js";
import { log } from "./shared/logger/log.js";


async function main(): Promise<void> {
	const testEnvValue = checkEnv();
	const userArgument = processArgs();
	const version = readVersion();

	log.info(`Hello from the Template! Version: ${version}`);
	log.info(`Test value from ".env" file: ${testEnvValue}`);
	log.info(`Test argument passed: ${userArgument}`);

	// Fake: You should await your application code here
	await Promise.resolve();
}

await main();