import { expect } from "chai";
import { tryCatch, tryCatchAsync } from "../src/shared/trycatch/trycatch.js";

const faulty = (): boolean => {
	throw new Error("Some error");
};

const good = (): boolean => {
	return true;
}

const faultyAsync = async (): Promise<boolean> => {
	throw new Error("Some error");
};

const goodAsync = async (): Promise<boolean> => {
	return Promise.resolve(true);
}


describe("trycatch", () => {
	describe("tryCatch", () => {
		it("handles good calls beautifully", () => {
			const {result, error} = tryCatch( 
				() => good()
			);
			if (error != null){
				throw error;
			}
			// At this point result is a boolean

			expect(result).to.be.not.null;
			expect(error).to.be.null;

		});	

		it("handles faulty calls beautifully", () => {
			const {result, error} = tryCatch( 
				() => faulty()
			);
			expect(result).to.be.null;
			expect(error).to.be.not.null;
		});	
	});

	describe("tryCatchAsync", () => {
		it("handles faulty async calls beautifully", async () => {
			const {result, error} = await tryCatchAsync(
				faultyAsync()
			);
			expect(result).to.be.null;
			expect(error).to.be.not.null;
		});	

		it("handles good async calls beautifully", async () => {
			const {result, error} = await tryCatchAsync(
				goodAsync()
			);
			if (error != null){
				throw error;
			}
			// At this point result is a boolean
			expect(result).to.be.not.null;
			expect(error).to.be.null;
		});	
	});
});