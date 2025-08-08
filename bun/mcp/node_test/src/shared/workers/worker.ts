import { parentPort  } from "worker_threads";

export interface JniResult {
	readonly success: boolean;
	readonly result: number[];
}

if (!parentPort) {
	throw new Error("No parent port");
}

parentPort.on("message", (workPackage: number[]) => {
	const result = workPackage.map(number => number * 2);
	if (!parentPort)
		throw new Error("No parent port");
	const jniResult: JniResult = {
		success: true,
		result,
	};	
	parentPort.postMessage(jniResult);
});
