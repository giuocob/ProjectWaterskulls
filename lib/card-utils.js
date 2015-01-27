var geneticAlgorithm = require('./genetic-algorithm');
var randomUtils = require('./random-utils');

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
	// Get array like [1,2,3,...size*size]
	var baseSquare = [];
	for(i = 1; i <= size*size; i++) {
		baseSquare.push(i);
	}
	var rowSquareMap = exports.constructRowSquareMap(size);
	var optimalRowTotal = (size * size + 1) / 2 * size;

	var generateChromosome = function() {
		return randomUtils.shuffle(baseSquare, rng);
	};

	var fitnessFunction = function(magicSquare) {
		var i;
		var totalDeviation = 0;
		for(var rowName in rowSquareMap) {
			var rowIndices = rowSquareMap[rowName];
			var rowSum = 0;
			for(i = 0; i < rowIndices.length; i++) {
				rowSum += magicSquare[rowIndices[i]];
			}
			totalDeviation += Math.abs(rowSum - optimalRowTotal);
		}
		return -1 * totalDeviation;
	};

	var mutate = function(rng, magicSquare) {
		// TODO: Actually do this
		magicSquare = magicSquare.slice();
		var swap = function(i1, i2) {
			var tmp = magicSquare[i1];
			magicSquare[i1] = magicSquare[i2];
			magicSquare[i2] = tmp;
		};
		// CAN WE DO BETTER
		swap(rng.randomInt(0,magicSquare.length-1), rng.randomInt(0,magicSquare.length-1));
		return magicSquare;
	};
	

	var result = geneticAlgorithm.runGeneticAlgorithm({
		rng: rng,
		generateChromosome: generateChromosome,
		fitness: fitnessFunction,
		crossover: mutate,
		parentsPerChromosome: 1,
		fitnessThreshold: 0,
		population: 100,
		maxGenerations: 500
	});
	return result;
};
