"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.genBlob = genBlob;
exports.genHBlobs = genHBlobs;
exports.genHLines = genHLines;
exports.test = void 0;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var seedrandom = require('seedrandom');

var randGen = seedrandom();

var Point = /*#__PURE__*/function () {
  function Point(x, y) {
    _classCallCheck(this, Point);

    this.x = x;
    this.y = y;
  }

  _createClass(Point, [{
    key: "toString",
    value: function toString() {
      return "".concat(this.x.toFixed(2), " ").concat(this.y.toFixed(2));
    }
  }]);

  return Point;
}();

function rnd(boundMin, boundMax) {
  return boundMin + randGen() * (boundMax - boundMin);
}

function truncate(pos, posMin, posMax) {
  if (posMin == null) posMin = Number.NEGATIVE_INFINITY;
  if (posMax == null) posMax = Number.POSITIVE_INFINITY;
  return Math.min(Math.max(pos, posMin), posMax);
}

function movePoint(pt, rho, r) {
  var _ref = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {},
      xMin = _ref.xMin,
      xMax = _ref.xMax,
      yMin = _ref.yMin,
      yMax = _ref.yMax;

  return new Point(truncate(pt.x + r * Math.cos(rho), xMin, xMax), truncate(pt.y + r * Math.sin(rho), yMin, yMax));
}

function compareArrays(a, b) {
  if (a.length !== b.length) return false;

  for (var i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

function isAuto(entry) {
  return entry == null || entry === "auto";
}

function preProcessOverride(width, height, opt, override) {
  var _loop = function _loop(i) {
    if (isAuto(override[i])) {
      override[i] = {
        x: null,
        y: null,
        angle: null
      };
    }

    ["x", "y", "angle"].forEach(function (k) {
      if (isAuto(override[i][k])) {
        if (k === "angle") {
          override[i][k] = ["w", opt.angleWindowSize];
        } else {
          override[i][k] = ["w", opt.posWindowSize];
        }

        if (i === 0) if (k === "x") {
          override[i].x = ["r", 0, 0];
        }
        if (i === override.length - 1) if (k === "x") {
          override[i].x = ["r", width, width];
        }
      } else if (override[i][k][0] === "p") {
        override[i][k] = ["r", override[i][k][1], override[i][k][1]];
      }
    });
  };

  // There are essentially two modes: exact ("p" and "r" modes) and auto (null and "w" modes).
  // So we can first convert all the p's to r's, and all the nulls to w's (with default window size).
  for (var i = 0; i < override.length; i++) {
    _loop(i);
  }
}

function checkOverride(width, opt, override) {
  // some checks
  if (override.length !== opt.numControls) {
    console.warn("Number of control points and the length of the override array are not equal." + " " + "The numControls option will be disregarded.");
    opt.numControls = override.length;
  } // the endpoints must be ["r", x, x]


  if (!compareArrays(override[0].x, ["r", 0, 0])) {
    console.error("The first element of override array must have x property of [0, 0].");
  }

  if (!compareArrays(override[opt.numControls - 1].x, ["r", width, width])) {
    console.error("The first element of override array must have x property of [0, 0].");
  }
}

function convertEndPoints(opt, override) {
  if (override[0].y[0] === "w") override[0].y = ["r", opt.leftPos - override[0].y[1] / 2, opt.leftPos + override[0].y[1] / 2];
  if (override[opt.numControls - 1].y[0] === "w") override[opt.numControls - 1].y = ["r", opt.leftPos - override[opt.numControls - 1].y[1] / 2, opt.leftPos + override[opt.numControls - 1].y[1] / 2];
}

function convertInteriorPoints(width, height, opt, override, initX, slope, intercept) {
  var _loop2 = function _loop2(i) {
    ["x", "y", "angle"].forEach(function (k) {
      if (override[i][k][0] === "w") {
        var center = null;
        var wSize = null;
        var minVal = null;
        var maxVal = null;

        switch (k) {
          case "angle":
            center = Math.atan(slope);
            wSize = opt.angleWindowSize;
            minVal = Number.NEGATIVE_INFINITY;
            maxVal = Number.POSITIVE_INFINITY;
            break;

          case "x":
            center = initX[i];
            wSize = opt.posWindowSize;
            minVal = 0;
            maxVal = width;
            break;

          case "y":
            center = initX[i] * slope + intercept;
            wSize = opt.posWindowSize;
            minVal = 0;
            maxVal = height;
            break;
        }

        override[i][k] = ["r", truncate(center - wSize / 2, minVal, maxVal), truncate(center + wSize / 2, minVal, maxVal)];
      }
    });
  };

  for (var i = 0; i < override.length; i++) {
    _loop2(i);
  }
}

function getMinDistance(a) {
  var minDistance = Number.POSITIVE_INFINITY;

  for (var i = 0; i < a.length - 1; i++) {
    minDistance = Math.min(minDistance, Math.sqrt(Math.pow(a[i].point.x - a[i + 1].point.x, 2) + Math.pow(a[i].point.y - a[i + 1].point.y, 2)));
  }

  return minDistance;
}

function getRange(maxNum) {
  return Array.from(new Array(maxNum), function (x, i) {
    return i;
  });
}

function genCurve(width, height, opt, override, initX) {
  // init data array
  var data = Array(opt.numControls);

  for (var i = 0; i < opt.numControls; i++) {
    data[i] = {
      initX: initX[i]
    };
  } // initial slope... first figure out final y's of endpoints


  var finalLeft = rnd(override[0].y[1], override[0].y[2]);
  var finalRight = rnd(override[opt.numControls - 1].y[1], override[opt.numControls - 1].y[2]);
  var slope = (finalRight - finalLeft) / width;
  override[0].y = ["r", finalLeft, finalLeft];
  override[opt.numControls - 1].y = ["r", finalRight, finalRight];
  convertInteriorPoints(width, height, opt, override, initX, slope, finalLeft);

  for (var _i = 0; _i < opt.numControls; _i++) {
    data[_i].angle = rnd(override[_i].angle[1], override[_i].angle[2]);
    data[_i].point = new Point(rnd(override[_i].x[1], override[_i].x[2]), rnd(override[_i].y[1], override[_i].y[2]));
  }

  if (opt.debug) console.log("data", JSON.parse(JSON.stringify(data)));
  var distance = getMinDistance(data);

  for (var _i2 = 0; _i2 < opt.numControls; _i2++) {
    data[_i2].ctrl = movePoint(data[_i2].point, data[_i2].angle, -1 * distance / 2);
    data[_i2].ctrl_alt = movePoint(data[_i2].point, data[_i2].angle, distance / 2);
  }

  if (opt.debug) console.log("data with controls", data);
  var curve = "M 0 " + data[0].point.y.toFixed(2) + " C " + data[0].ctrl_alt + ", " + data[1].ctrl + ", " + data[1].point + " ";

  for (var _i3 = 2; _i3 < opt.numControls; _i3++) {
    curve += "S " + data[_i3].ctrl + ", " + data[_i3].point + " ";
  }

  return {
    data: data,
    curve: curve
  };
}

function genHLines(width, height, options, override) {
  // Override is an array of objects.
  // If the entry at position i is null, undefined, or "auto", then default is applied.
  // Each non-auto entry is an object with 3 possible keys: x, y, and angle.
  // Each key has a value that's an array (or null). The first element of the array
  // is the "mode" of overriding. There are 3 possible (non-null) modes:
  // 	- null, undefined, or "auto"
  // 	- ["p", value]: specify the exact value
  // 	- ["w", value]: specify the size of the window
  // 	- ["r", l_bound, u_bound]: specify the minimum and maximum values
  var opt = _objectSpread({
    leftPos: 0.5 * height,
    rightPos: 0.5 * height,
    posWindowSize: 0.2 * height,
    angleWindowSize: Math.PI / 3,
    numControls: 2,
    seed: '',
    debug: false
  }, options);

  if (opt.seed !== '') {
    randGen = seedrandom(opt.seed);
    if (opt.debug) console.log('seeded with string: ', opt.seed);
  } else {
    randGen = seedrandom();
    if (opt.debug) console.log('no seed');
  }

  if (opt.debug) console.log("inital opt", JSON.parse(JSON.stringify(opt))); // preprocess override

  if (!override) override = Array(opt.numControls).fill("auto");
  preProcessOverride(width, height, opt, override);
  checkOverride(width, opt, override);
  convertEndPoints(opt, override);
  if (opt.debug) console.log("post-processed override", JSON.parse(JSON.stringify(override)));
  var initX = getRange(opt.numControls).map(function (x) {
    return x / (opt.numControls - 1) * width;
  });
  if (opt.debug) console.log("initX", JSON.parse(JSON.stringify(initX)));
  var lastFixed = 0;

  for (var i = 1; i < opt.numControls; i++) {
    if (opt.debug) {
      console.log("---", i);
    }

    if (override[i].x[0] === "r") {
      initX[i] = (override[i].x[1] + override[i].x[2]) / 2;

      if (opt.debug) {
        console.log(i, "is in r mode...");
        console.log(i, initX[i]);
      }

      if (i - lastFixed > 1) {
        // do linear interpolation from the last fixed point
        var lengthInBetween = (initX[i] - initX[lastFixed]) / (i - lastFixed);

        for (var j = lastFixed + 1; j < i; j++) {
          initX[j] = initX[j - 1] + lengthInBetween;

          if (opt.debug) {
            console.log(j, initX[j]);
          }
        }
      }

      lastFixed = i;
    }
  }

  if (opt.debug) {
    console.log("initX at the end", initX);
  }

  var r = getRange(opt.numLines).map(function (i) {
    var tmp_override = JSON.parse(JSON.stringify(override));
    return genCurve(width, height, opt, tmp_override, initX);
  });
  return r;
}

function genOneBlob(rand, size, initRadius, distance, opt) {
  var tmp = rand() * 2 * Math.PI;
  var initAngle = getRange(opt.numControls).map(function (x) {
    return tmp + x / opt.numControls * 2 * Math.PI;
  });
  var center = new Point(size / 2, size / 2);
  var data = Array(opt.numControls);

  for (var i = 0; i < opt.numControls; i++) {
    data[i] = {
      point: movePoint(movePoint(center, initAngle[i], initRadius), rand() * Math.PI * 2, rand() * opt.posWindowSize)
    };
    data[i].angle = rnd(initAngle[i] + Math.PI / 2 - opt.angleWindowSize / 2, initAngle[i] + Math.PI / 2 + opt.angleWindowSize / 2);
    data[i].ctrl = movePoint(data[i].point, data[i].angle, -1 * rnd(distance * (1 - opt.handleWindowSize), distance * (1 + opt.handleWindowSize)));
    data[i].ctrl_alt = movePoint(data[i].point, data[i].angle, rnd(distance * (1 - opt.handleWindowSize), distance * (1 + opt.handleWindowSize)));
  }

  var path = "M " + data[0].point + " " + "C " + data[0].ctrl_alt + ", " + data[1].ctrl + ", " + data[1].point + " ";

  for (var _i4 = 2; _i4 < opt.numControls; _i4++) {
    path += "S " + data[_i4].ctrl + ", " + data[_i4].point + " ";
  }

  path += "S " + data[0].ctrl + ", " + data[0].point;
  return {
    path: path,
    data: data
  };
}

function genBlob(size, options) {
  return genHBlobs(size, options)[0];
}

function genHBlobs(size, options) {
  var opt = _objectSpread({
    numBlobs: 1,
    numControls: 3,
    posWindowSize: 0.1 * size,
    angleWindowSize: Math.PI / 3,
    handleWindowSize: 0.5,
    seed: '',
    debug: false
  }, options);

  if (opt.seed !== '') {
    randGen = seedrandom(opt.seed);
    if (opt.debug) console.log('seeded with string: ', opt.seed);
  } else {
    randGen = seedrandom();
    if (opt.debug) console.log('no seed');
  }

  var r = getRange(opt.numBlobs).map(function (i) {
    var initRadius = size / 2 - 2 * opt.posWindowSize;
    var distance = 2 * Math.PI * initRadius / opt.numControls / 2.5;
    return genOneBlob(randGen, size, initRadius, distance, opt);
  });
  return r;
}

var test = function test() {
  return "abcdef";
};

exports.test = test;