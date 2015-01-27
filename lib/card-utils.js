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
// Opts can contain tolerance, which is the cumulative error across all rows. It defaults to a small, nonzero number for faster calculation
// and greater card diversity. This tolerance is not a guarantee; The algorithm will terminate at a set time, regardless of whether
// or not the tolerance was met.
exports.generateMagicSquare = function(size, rng, opts) {
	var i;
	if(!opts) opts = {};
	if(size < 1) throw new Error('Invalid size given to generateMagicSquare');
	if(size == 1) return [1];  // Trivial
	if(size == 2) throw new Error('There are no magic squares of size 2');
	// Get array like [1,2,3,...size*size]
	var baseSquare = [];
	for(i = 1; i <= size*size; i++) {
		baseSquare.push(i);
	}
	// This will not make perfect squares. Cumulative errors will be accepted, depending on size.
	// Some other parameters are also adjusted; they make a large difference in performance for reasons i dont understand.
	var fitnessThreshold, selectionFitnessPercentage;
	if(size < 5) {
		fitnessThreshold = 0;
		selectionFitnessPercentage = 0.1;
	} else if(size == 5) {
		fitnessThreshold = -3;
		selectionFitnessPercentage = 0.05;
	} else {
		fitnessThreshold = -1 * (Math.ceil(size / 2) + 1);
		selectionFitnessPercentage = 0.01;
	}
	if(typeof opts.tolerance == 'number') fitnessThreshold = -1 * opts.tolerance;

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
		magicSquare = magicSquare.slice();
		var swap = function(i1, i2) {
			var tmp = magicSquare[i1];
			magicSquare[i1] = magicSquare[i2];
			magicSquare[i2] = tmp;
		};
		// Swap two random values. ez.
		swap(rng.randomInt(0,magicSquare.length-1), rng.randomInt(0,magicSquare.length-1));
		return magicSquare;
	};
	

	var result = geneticAlgorithm.runGeneticAlgorithm({
		rng: rng,
		generateChromosome: generateChromosome,
		fitness: fitnessFunction,
		crossover: mutate,
		parentsPerChromosome: 1,
		fitnessThreshold: fitnessThreshold,
		population: 300,
		selectionFitnessPercentage: selectionFitnessPercentage,
		maxGenerations: 500,
		cleanResult: true
	});
	return result;
};
