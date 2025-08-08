import { expect } from "chai";

const sleepAsync = async (ms: number)  => {
	return new Promise(resolve => setTimeout(resolve, ms))
};


describe("async sleep", () => {
	it("it should sleep about 1000ms", async () => {
		const start = Date.now();
		await sleepAsync(1000);
		const end = Date.now();
		const diff = end - start;
		expect(diff).to.be.approximately(1000, 100);
	});	
});
