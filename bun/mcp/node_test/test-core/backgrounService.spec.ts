import { expect } from "chai";


const PAUSE_MS = 100 as const;
const MAX_TICKS = 10 as const;

const sleepAsync = async (ms: number)  => {
	return new Promise(resolve => setTimeout(resolve, ms))
};

class BackgroundService {

	private _keepAlive = true;
	private _tickCounter = 0;

	constructor(
		private _workPackage: number[],
	){
		setTimeout(this.tick.bind(this), PAUSE_MS);
	}

	private tick(): void{
		this._process();
		this._tickCounter++;

		if (this._tickCounter >= MAX_TICKS){
			this.exit();
		}
		else {
			if (this._keepAlive){
				setTimeout(this.tick.bind(this), PAUSE_MS);
			}
		}
	}

	exit(): void{
		this._keepAlive = false;
	}

	private _process(): void{
		this._workPackage.push(this._tickCounter);
	}

	get workPackage(): number[]{
		// Return a copy
		return [...this._workPackage];
	}

	isAlive(): boolean{
		return this._keepAlive;
	}
}


describe("background service", () => {
	it("should work for 1000ms and produce an array of 10 numbers", async () => {
		const service = new BackgroundService([]);
		await sleepAsync(1100);
		expect(service.isAlive()).to.be.false;
		expect(service.workPackage).to.have.lengthOf(10);
	});	
});