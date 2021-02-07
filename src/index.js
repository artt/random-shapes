const seedrandom = require('seedrandom');
let randGen = seedrandom();

class Point {
	constructor(x, y) {
		this.x = x
		this.y = y
	}
	toString() {
		return `${this.x.toFixed(2)} ${this.y.toFixed(2)}`
	}
}

function rnd(boundMin, boundMax) {
	return boundMin + (randGen() * (boundMax - boundMin))
}

function truncate(pos, posMin, posMax) {
	if (posMin == null) posMin = Number.NEGATIVE_INFINITY
	if (posMax == null) posMax = Number.POSITIVE_INFINITY
	return Math.min(Math.max(pos, posMin), posMax)
}

function movePoint(pt, rho, r, { xMin, xMax, yMin, yMax }={}) {
	return new Point(truncate(pt.x + r * Math.cos(rho), xMin, xMax),
									 truncate(pt.y + r * Math.sin(rho), yMin, yMax))
}

function compareArrays(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i ++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

function isAuto(entry) {
	return (entry == null || entry === "auto")
}

function preProcessOverride(width, height, opt, override) {

	// There are essentially two modes: exact ("p" and "r" modes) and auto (null and "w" modes).
	// So we can first convert all the p's to r's, and all the nulls to w's (with default window size).

	for (let i = 0; i < override.length; i ++) {
		if (isAuto(override[i])) {
			override[i] = {x: null, y: null, angle: null}
		}

		["x", "y", "angle"].forEach(k => {
			if (isAuto(override[i][k])) {
				if (k === "angle") {
					override[i][k] = ["w", opt.angleWindowSize]
				}
				else {
					override[i][k] = ["w", opt.posWindowSize]
				}
				if (i === 0)
					if (k === "x") {
						override[i].x = ["r", 0, 0]
					}
				if (i === override.length - 1)
					if (k === "x") {
						override[i].x = ["r", width, width]
					}
			}
			else if (override[i][k][0] === "p") {
				override[i][k] = ["r", override[i][k][1], override[i][k][1]]
			}
		})
	}

}

function checkOverride(width, opt, override) {
	// some checks
	if (override.length !== opt.numControls) {
		console.warn("Number of control points and the length of the override array are not equal."
			+ " " + "The numControls option will be disregarded.")
		opt.numControls = override.length
	}
	// the endpoints must be ["r", x, x]
	if (!compareArrays(override[0].x, ["r", 0, 0])) {
		console.error("The first element of override array must have x property of [0, 0].")
	}
	if (!compareArrays(override[opt.numControls - 1].x, ["r", width, width])) {
		console.error("The first element of override array must have x property of [0, 0].")
	}
}

function convertEndPoints(opt, override) {
	if (override[0].y[0] === "w")
		override[0].y = ["r", opt.leftPos - override[0].y[1]/2, opt.leftPos + override[0].y[1]/2]
	if (override[opt.numControls - 1].y[0] === "w")
		override[opt.numControls - 1].y = ["r", opt.leftPos - override[opt.numControls - 1].y[1]/2, opt.leftPos + override[opt.numControls - 1].y[1]/2]
}

function 	convertInteriorPoints(width, height, opt, override, initX, slope, intercept) {

	for (let i = 0; i < override.length; i ++) {
		["x", "y", "angle"].forEach(k => {
			if (override[i][k][0] === "w") {
				let center = null
				let wSize = null
				let minVal = null
				let maxVal = null
				switch (k) {
					case "angle":
						center = Math.atan(slope)
						wSize = opt.angleWindowSize
						minVal = Number.NEGATIVE_INFINITY
						maxVal = Number.POSITIVE_INFINITY
						break;
					case "x":
						center = initX[i]
						wSize = opt.posWindowSize
						minVal = 0
						maxVal = width
						break;
					case "y":
						center = initX[i] * slope + intercept
						wSize = opt.posWindowSize
						minVal = 0
						maxVal = height
						break;
				}
				override[i][k] = ["r", truncate(center - wSize/2, minVal, maxVal), truncate(center + wSize/2, minVal, maxVal)]
			}
		})
	}

}

function getMinDistance(a) {
	let minDistance = Number.POSITIVE_INFINITY
	for (let i = 0; i < a.length - 1; i ++) {
		minDistance = Math.min(
			minDistance,
			Math.sqrt(Math.pow(a[i].point.x - a[i+1].point.x, 2) + Math.pow(a[i].point.y - a[i+1].point.y, 2))
		)
	}
	return minDistance
}

function getRange(maxNum) {
	return Array.from(new Array(maxNum), (x, i) => i)
}

function genCurve(width, height, opt, override, initX) {

	// init data array
	let data = Array(opt.numControls)
	for (let i = 0; i < opt.numControls; i ++) {
		data[i] = {initX: initX[i]}
	}

	// initial slope... first figure out final y's of endpoints
	const finalLeft = rnd(override[0].y[1], override[0].y[2])
	const finalRight = rnd(override[opt.numControls - 1].y[1], override[opt.numControls - 1].y[2])
	const slope = (finalRight - finalLeft) / width
	override[0].y = ["r", finalLeft, finalLeft]
	override[opt.numControls - 1].y = ["r", finalRight, finalRight]

	convertInteriorPoints(width, height, opt, override, initX, slope, finalLeft)

	for (let i = 0; i < opt.numControls; i ++) {
		data[i].angle = rnd(override[i].angle[1], override[i].angle[2])
		data[i].point = new Point(rnd(override[i].x[1], override[i].x[2]), rnd(override[i].y[1], override[i].y[2]))
	}

	if (opt.debug) 
		console.log("data", JSON.parse(JSON.stringify(data)))
	const distance = getMinDistance(data)

	for (let i = 0; i < opt.numControls; i ++) {
		data[i].ctrl = movePoint(data[i].point, data[i].angle, -1*distance/2)
		data[i].ctrl_alt = movePoint(data[i].point, data[i].angle, distance/2)
	}

	if (opt.debug)
		console.log("data with controls", data)

	let curve = "M 0 " + data[0].point.y.toFixed(2) + " C " + data[0].ctrl_alt + ", " + data[1].ctrl + ", " + data[1].point + " "
	for (let i = 2; i < opt.numControls; i ++) {
		curve += "S " + data[i].ctrl + ", " + data[i].point + " "
	}

	return {data: data, curve: curve}

}

export function genHLines(width, height, options, override) {

	// Override is an array of objects.
	// If the entry at position i is null, undefined, or "auto", then default is applied.
	// Each non-auto entry is an object with 3 possible keys: x, y, and angle.
	// Each key has a value that's an array (or null). The first element of the array
	// is the "mode" of overriding. There are 3 possible (non-null) modes:
	// 	- null, undefined, or "auto"
	// 	- ["p", value]: specify the exact value
	// 	- ["w", value]: specify the size of the window
	// 	- ["r", l_bound, u_bound]: specify the minimum and maximum values
	
	const opt = {
		leftPos: 0.5*height,
		rightPos: 0.5*height,
		posWindowSize: 0.2*height,
		angleWindowSize: Math.PI/3,
		numControls: 2,
		seed: '',
		debug: false,
		...options
	}

	if (opt.seed !== '') {
		randGen = seedrandom(opt.seed)
		if (opt.debug)
			console.log('seeded with string: ', opt.seed)
	}
	else {
		randGen = seedrandom()
		if (opt.debug)
			console.log('no seed')
	}

	if (opt.debug)
		console.log("inital opt", JSON.parse(JSON.stringify(opt)))

	// preprocess override
	if (!override)
		override = Array(opt.numControls).fill("auto")
	preProcessOverride(width, height, opt, override)
	checkOverride(width, opt, override)
	convertEndPoints(opt, override)

	if (opt.debug)
		console.log("post-processed override", JSON.parse(JSON.stringify(override)))

	let initX = getRange(opt.numControls).map(x => x / (opt.numControls - 1) * width)
	if (opt.debug)
		console.log("initX", JSON.parse(JSON.stringify(initX)))

	let lastFixed = 0
	
	for (let i = 1; i < opt.numControls; i ++) {
		if (opt.debug) {
			console.log("---", i)
		}
		if (override[i].x[0] === "r") {
			initX[i] = (override[i].x[1] + override[i].x[2]) / 2
			if (opt.debug) {
				console.log(i, "is in r mode...")
				console.log(i, initX[i])
			}
			if (i - lastFixed > 1) {
				// do linear interpolation from the last fixed point
				const lengthInBetween = (initX[i] - initX[lastFixed]) / (i - lastFixed)
				for (let j = lastFixed + 1; j < i; j ++) {
					initX[j] = initX[j - 1] + lengthInBetween
					if (opt.debug) {
						console.log(j, initX[j])
					}
				}
			}
			lastFixed = i
		}
	}

	if (opt.debug){
		console.log("initX at the end", initX)
	}
	
	const r = getRange(opt.numLines).map(i => {
		let tmp_override = JSON.parse(JSON.stringify(override))
		return genCurve(width, height, opt, tmp_override, initX)
	})
	return(r)
}

function genOneBlob(rand, size, initRadius, distance, opt) {
	const tmp = rand() * 2 * Math.PI;

	const initAngle = getRange(opt.numControls).map(x => tmp + x/opt.numControls*2*Math.PI)
	const center = new Point(size/2, size/2)

	let data = Array(opt.numControls)
		for (let i = 0; i < opt.numControls; i ++) {
		data[i] = {point: movePoint(
												movePoint(center, initAngle[i], initRadius),
												rand() * Math.PI*2,
												rand() * opt.posWindowSize)}
		data[i].angle = rnd(initAngle[i] + Math.PI/2 - opt.angleWindowSize/2, initAngle[i] + Math.PI/2 + opt.angleWindowSize/2)
		data[i].ctrl = movePoint(data[i].point, data[i].angle, -1*rnd(distance*(1-opt.handleWindowSize), distance*(1+opt.handleWindowSize)))
		data[i].ctrl_alt = movePoint(data[i].point, data[i].angle, rnd(distance*(1-opt.handleWindowSize), distance*(1+opt.handleWindowSize)))
	}

	let path = "M " + data[0].point + " "
		+ "C " + data[0].ctrl_alt + ", " + data[1].ctrl + ", " + data[1].point + " "
	for (let i = 2; i < opt.numControls; i ++) {
		path += "S " + data[i].ctrl + ", " + data[i].point + " "
	}
	path += "S " + data[0].ctrl + ", " + data[0].point

	return({path: path, data: data})
}

export function genBlob(size, options) {
	return genHBlobs(size, options)[0]
}

export function genHBlobs(size, options) {
	
	const opt = {
		numBlobs: 1,
		numControls: 3,
		posWindowSize: 0.1*size,
		angleWindowSize: Math.PI/3,
		handleWindowSize: 0.5,
		seed: '',
		debug: false,
		...options
	}

	if (opt.seed !== '') {
		randGen = seedrandom(opt.seed)
		if (opt.debug)
			console.log('seeded with string: ', opt.seed)
	}
	else {
		randGen = seedrandom()
		if (opt.debug)
			console.log('no seed')
	}

	const r = getRange(opt.numBlobs).map(i => {
		const initRadius = size/2 - 2*opt.posWindowSize
		const distance = 2*Math.PI*initRadius / opt.numControls / 2.5

		return genOneBlob(randGen, size, initRadius, distance, opt)
	})
	return(r)
}

export const test = () => {
	return "abcdef"
}
