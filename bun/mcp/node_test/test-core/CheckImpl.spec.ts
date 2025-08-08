import { expect } from "chai";

interface IService {
	doSomething(): string
}

class ServiceA implements IService {
	doSomething(): string {
		return "ServiceA result";
	}
}

class ServiceB implements IService {
	doSomething(): string {
		return "ServiceB result";
	}
}


const createService = (type: "A" | "B"): IService => {
	if (type === "A"){
		return new ServiceA();
	}
	else if (type === "B") {
		return new ServiceB();
	}
	throw new Error("Wrong type given");
}


describe("createService", () => {
	
	it("should return an instance of ServiceB when type 'B' is provided", () => {
		const serviceB = createService("B");
		expect(serviceB).to.be.instanceOf(ServiceB);
		
		const bResult = serviceB.doSomething();
		expect(bResult).to.equal("ServiceB result");
	});
	
});