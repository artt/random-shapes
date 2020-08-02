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
	return boundMin + (Math.random() * (boundMax - boundMin))
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

function getPointAttribute(pt, pattern) {
	let tmp = {}
	tmp[pattern.replace("?", "x")] = pt.x.toFixed(2)
	tmp[pattern.replace("?", "y")] = pt.y.toFixed(2)
	return tmp
}

function compareArrays(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i ++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

export function RandomBlob({ size, options, className }) {
	
	const opt = {
		numControls: 3,
		posWindowSize: 0.1*size,
		angleWindowSize: Math.PI/3,
		handleWindowSize: 0.5,
		style: {fill: "grey"},
		className: "",
		debug: false,
		...options
	}

	const initRadius = size/2 - 2*opt.posWindowSize
	const distance = 2*Math.PI*initRadius / opt.numControls / 2.5

	const tmp = Math.random() * 2 * Math.PI;
	// console.log(tmp + 2)

	const initAngle = getRange(opt.numControls).map(x => tmp + x/opt.numControls*2*Math.PI)
	const center = new Point(size/2, size/2)

	let data = Array(opt.numControls)
		for (let i = 0; i < opt.numControls; i ++) {
		data[i] = {point: movePoint(
												movePoint(center, initAngle[i], initRadius),
												Math.random() * Math.PI*2,
												Math.random() * opt.posWindowSize)}
		data[i].angle = rnd(initAngle[i] + Math.PI/2 - opt.angleWindowSize/2, initAngle[i] + Math.PI/2 + opt.angleWindowSize/2)
		data[i].ctrl = movePoint(data[i].point, data[i].angle, -1*rnd(distance*(1-opt.handleWindowSize), distance*(1+opt.handleWindowSize)))
		data[i].ctrl_alt = movePoint(data[i].point, data[i].angle, rnd(distance*(1-opt.handleWindowSize), distance*(1+opt.handleWindowSize)))
	}

	let path = "M" + data[0].point + " "
		+ "C " + data[0].ctrl_alt + ", " + data[1].ctrl + ", " + data[1].point + " "
	for (let i = 2; i < opt.numControls; i ++) {
		path += "S " + data[i].ctrl + ", " + data[i].point + " "
	}
	path += "S " + data[0].ctrl + ", " + data[0].point


	return(  
		`<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"
				version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg">
			<path d="${path}" />
		</svg>`
	)

}