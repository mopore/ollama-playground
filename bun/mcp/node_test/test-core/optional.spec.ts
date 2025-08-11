import { expect } from "chai";
import { Option, none, optionalDefined, some } from "../src/shared/optional/optional.js";

const someWithOptionDefined = (): Option<string> => optionalDefined("some");
const optionWithSome = (): Option<string> => some("some");
const optionWithNone = (): Option<string> => none();

describe("optional package", () => {
	it("optionaldefined function returns option with some", () => {
		const definedOption = someWithOptionDefined();
		expect(definedOption.isSome()).to.be.true;
		expect(definedOption.isNone()).to.be.false;

		const unwrap = someWithOptionDefined().unwrap();
		expect(unwrap).to.equal("some");
	});

	it("option created with 'some' returns option with some", () => {
		const someOption = optionWithSome();
		expect(someOption.isSome()).to.be.true;
		expect(someOption.isNone()).to.be.false;

		const unwrap = optionWithSome().unwrap();
		expect(unwrap).to.equal("some");
	});

	it("option created with none returns option with none", () => {
		const noneOption = optionWithNone();
		expect(noneOption.isSome()).to.be.false;
		expect(noneOption.isNone()).to.be.true;
		expect( () => noneOption.unwrap() ).to.throw();
	})
});
