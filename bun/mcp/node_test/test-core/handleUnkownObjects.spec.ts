import { expect } from "chai";

interface Person {
	name: string;
	age: number;
}


const identifyUnkownObject = (unknownObject: unknown): (Person | number | string | Array<any>) => {
	if (typeof unknownObject === 'number') {
		return unknownObject;
	}
	if (typeof unknownObject === 'string') {
		return unknownObject;
	}
	if (Array.isArray(unknownObject)) {
		return unknownObject;
	}
	if (
		unknownObject &&
		typeof unknownObject === 'object' &&
		'name' in unknownObject &&
		'age' in unknownObject
	) {	
		return unknownObject as Person;
	}
	throw new Error(`Could not determine type of unknownObject: ${unknownObject}`);
}


describe("identify unkown objects", () => {
	it("should identify the number", () => {
		const numberCandidate = JSON.parse("1");
		const result = identifyUnkownObject(numberCandidate);
		expect(result).to.equal(1);
		expect(result).to.be.a("number");
	});
	it("should fail to identify the number", () => {
		const numberCandidate = JSON.parse('"Text"');
		const result = identifyUnkownObject(numberCandidate) as number;
		expect(result).to.not.equal(1);
		expect(result).not.to.be.instanceOf(Number);
	});
	it("should identify the string", () => {
		const stringCandidate = JSON.parse('"string"');
		const result = identifyUnkownObject(stringCandidate);
		expect(result).to.equal("string");
		expect(result).to.be.a("string");
	});
	it("should identify the array", () => {
		const arrayCandidate = JSON.parse('[1, 2]');
		const result = identifyUnkownObject(arrayCandidate);
		expect(result).to.be.an("Array");
	});
	it ("should identify the person", () => {
		const personCandidate = JSON.parse('{"name": "John", "age": 42}');
		const result = identifyUnkownObject(personCandidate) as Person;
		expect(result.name).to.equal("John");
		expect(result.age).to.equal(42);
		expect(result).to.be.an("Object");
	});
});
