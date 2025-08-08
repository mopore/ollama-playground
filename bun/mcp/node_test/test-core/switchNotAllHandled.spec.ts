import { expect } from "chai";

const shapeKinds = {
	Circle: "circle",
	Square: "square",
} as const;

type ShapeKind = (typeof shapeKinds[keyof typeof shapeKinds]);

interface Shape {
	kind: ShapeKind;
}

describe("switch with all cases.", () => {
	it("should not throw because all handeled.", () => {
		const myCircle: Shape = { kind: shapeKinds.Circle };		

		switch (myCircle.kind) {
			case shapeKinds.Circle:
				expect(myCircle.kind).to.equal(shapeKinds.Circle);
				break;
			case shapeKinds.Square:
				expect(myCircle.kind).to.equal(shapeKinds.Square);
				break;
			default:
				throw new Error("unreachable");
		} 
	});
});
