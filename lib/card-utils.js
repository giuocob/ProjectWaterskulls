// Cross-generator utilities for manipulating and calculating information about bingo cards

exports.constructRowSquareMap = function(boardSize) {
	var rowSquareMap = {};
	var numSquares = boardSize * boardSize;
	var row, square;
	// Make rows...
	for(var rowNum = 0; rowNum < boardSize; rowNum++) {
		row = [];
		for(var rowIndex = 0; rowIndex < boardSize; rowIndex++) {
			row.push(rowNum * boardSize + rowIndex);
		}
		rowSquareMap['row'+rowNum] = row;
	}
	// Make columns...
	for(var columnNum = 0; columnNum < boardSize; columnNum++) {
		row = [];
		for(var columnIndex = 0; columnIndex < boardSize; columnIndex++) {
			row.push(columnIndex * boardSize + columnNum);
		}
		rowSquareMap['col'+columnNum] = row;
	}
	// tlbr!
	var diagIndex;
	row = [];
	for(diagIndex = 0; diagIndex < boardSize; diagIndex++) {
		row.push(diagIndex * (boardSize + 1));
	}
	rowSquareMap.tlbr = row;
	// bltr!
	row = [];
	for(diagIndex = 0; diagIndex < boardSize; diagIndex++) {
		row.push(diagIndex * boardSize + (boardSize - diagIndex - 1));
	}
	rowSquareMap.bltr = row;

	return rowSquareMap;
};

// Intended to invert the rowSquareMap returned above, but perhaps useful elsewhere. Input should be a map of object keys to
// arrays of primitives. The output will map the the array elements to the original properties used to index them.
exports.invertRowSquareMap = function(rowSquareMap) {
	var inverse = {};
	for(var rowName in rowSquareMap) {
		var row = rowSquareMap[rowName];
		for(var rowIndex = 0; rowIndex < row.length; rowIndex++) {
			var squareIndex = row[rowIndex];
			if(!inverse[squareIndex]) inverse[squareIndex] = [];
			inverse[squareIndex].push(rowName);
		}
	}

	return inverse;
};

// Returns a magic square for the given size, using the given RNG.
// Will be returned as a flat array with size^2 indexes, which represents rows, then columns.
exports.generateMagicSquare = function(size, rng) {
	var i;
	// Get 2 different orderings of [0,1,2,...n-1]
	var baseArray = [];
	for(i = 0; i < size; i++) {
		baseArray.push(i);
	}
	var table1 = randomUtils.shuffle(baseArray, rng);
	var table2 = randomUtils.shuffle(baseArray, rng);
	var remT = rng.randomInt(0, size-1);
	var remMult = Math.floor(size/2) + 1;

	var ret = [];
	for(i = 0; i < size*size; i++) {
		// Some math Gombill came up with long long ago
		var x = (i + remT) % size;
		var y = Math.floor(i / size);
		var e1 = table1[(x + remMult*y) % size];
		var e2 = table2[(remMult*x + y) % size];
		value = size * e1 + e2 + 1;
		ret.push(value);
	}

	return ret;
};
