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
	if(size < 1) throw new Error('Magic square size must be at least 1');
	if(size == 1) return [1];  // Trivial
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
		var i;
		magicSquare = magicSquare.slice();
		// Funky idea:
		// 1. Randomly select the n most stable rows to leave alone, up to size-1
		// 2. Randomly select 2 remaining indices and swap them

		function swap(i1, i2) {
			var tmp = magicSquare[i1];
			magicSquare[i1] = magicSquare[i2];
			magicSquare[i2] = tmp;
		}

		// Calculate scores by row
		var rowScores = {};
		for(var rowName in rowSquareMap) {
			var rowIndices = rowSquareMap[rowName];
			var rowSum = 0;
			for(i = 0; i < rowIndices.length; i++) {
				rowSum += magicSquare[rowIndices[i]];
			}
			rowScores[rowName] = Math.abs(optimalRowTotal - rowSum);
		}
		// Sort by stability
		var sortedRows = Object.keys(rowSquareMap).sort(function(a,b) {
			return rowScores[a] - rowScores[b];
		});
		// Randomly select # rows to blacklist and do so
		var squareBlacklist = {};
		var rowsToBlacklist = rng.randomInt(0, size-1);
		for(i = 0; i < rowsToBlacklist; i++) {
			rowSquareMap[sortedRows[i]].forEach(function(square) {
				squareBlacklist[square] = true;
			});
		}
		var availableSquares = [];
		for(i = 0; i < baseSquare.length; i++) {
			var square = baseSquare[i];
			if(!squareBlacklist[square]) availableSquares.push(square);
		}
		
		// Swap random allowed indices
		var swapIndex1 = availableSquares[rng.randomInt(0,availableSquares.length-1)];
		var swapIndex2 = availableSquares[rng.randomInt(0,availableSquares.length-1)];
		swap(swapIndex1, swapIndex2);

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
