import { expect } from "chai";
import { Worker } from "worker_threads";
import { JniResult } from "../src/shared/workers/worker.js";
import os from "os";

const PATH_TO_WORKER_FILE = "./dist/src/shared/workers/worker.js";
const TOTAL_NO_OF_WORK_ITEMS = 10_000_000 as const;

const devideWork = (workInput: number[], numberOfWorkers: number): number[][] => {
	const workPackages: number[][] = [];
	const workPackageSize = Math.ceil(workInput.length / numberOfWorkers);
	for (let i = 0; i < numberOfWorkers; i++){
		const start = i * workPackageSize;
		const end = start + workPackageSize;
		const workPackage = workInput.slice(start, end);
		workPackages.push(workPackage);
	}
	return workPackages;
}

const runWorkersOnAllCores = async (numberOfWorkers: number): Promise<JniResult[]> => {
	let resultsCounter = 0;

	const oneThousands = Array.from(Array(TOTAL_NO_OF_WORK_ITEMS).keys());
	const workPackages = devideWork(oneThousands, numberOfWorkers);
	
	let jniResults: JniResult[] = []; 
	workPackages.forEach(workPackage => {
		const worker = new Worker(PATH_TO_WORKER_FILE);
		worker.postMessage(workPackage);
		worker.on("message", (result) => {
			jniResults.push(result);
			resultsCounter++;
		});
	});

	let waitCounter = 0;
	while (resultsCounter < numberOfWorkers){
		await new Promise(resolve => setTimeout(resolve, 100));
		waitCounter++;
		if (waitCounter > 20){
			break;
		}
	}
	return jniResults;
}

describe("use all cores to run work with workers", () => {

	// This should corrollate with the number of cores.
	const workersLength = os.cpus().length; 

	it("it should use all available cores", async () => {
		const jniResults = await runWorkersOnAllCores(workersLength);
		expect(jniResults.length).to.equal(workersLength);
		let totalNumberOfWorkItems = 0;
		for (const result of jniResults){
			expect(result.success).to.be.true;
			totalNumberOfWorkItems += result.result.length;
		}
		expect(totalNumberOfWorkItems).to.equal(TOTAL_NO_OF_WORK_ITEMS);
	});	
});