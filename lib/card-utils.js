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
