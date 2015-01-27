var Generator = require('./generator');
var util = require('util');
var cardUtils = require('../lib/card-utils');
var randomUtils = require('../lib/random-utils');

var defaultBoardSize = 5;

var DSGenerator = function(opts) {
	Generator.call(this,opts);
	if(!this.itemList || this.itemList.cardType != 'difficulty-synergy') throw new Error('itemList must have a type of difficulty-synergy');
};
util.inherits(DSGenerator, Generator);

DSGenerator.requiresRouter = false;

DSGenerator.prototype.getCard = function(rng, opts) {
	if(!opts) opts = {};
	var boardSize = opts.size || defaultBoardSize;
	var numSquares = boardSize * boardSize;
	if(boardSize < 3 || boardSize > 7) throw new Error('Provided boardSize is out of range');
	var goals = this.itemList.items || [];
	goals.filter(function(goalObj) {
		return !!goalObj.goal;
	});
	// Require a minimum list length of at least 3*size^2 to have some sort of hope that the algorithm will actually finish
	// This means every difficulty tier has 3 bucketsor more, which is maybe enough?
	if((3 * this.boardSize * this.boardSize) > goals.length) throw new Error('Goal list is too short for this board size');
	// Item difficulties are hard-coded as 1-25. Since we're supporting multiple board sizes, the easiest way will be to sort the goal list
	// by difficulty, scale it linearly, and return requested slices.
	goals.sort(function(a,b) {
		return (a.difficulty || 0) - (b.difficulty || 0);
	});
	function getGoalsAtDifficulty(diff) {
		// Diff between 1 and size^2
		var blockSize = goals.length / (boardSize * boardSize);
		var startingIndex = blockSize * (diff - 1);
		var endingIndex = blockSize * diff;
		if(endingIndex % 1 === 0) endingIndex--;
		return goals.slice(Math.ceil(startingIndex), Math.floor(endingIndex)+1);
	}

	var rowSquareMap = cardUtils.constructRowSquareMap(boardSize);
	var squareRowMap = cardUtils.invertRowSquareMap(rowSquareMap);

	// Keep trying to generate card until one sticks
	var generatedCard;
	while(!generatedCard) {
		generatedCard = generate();
	}

	// The main function
	function generate() {
		var i;
		// Get today's magic square, and inverse index map
		var magicSquare = cardUtils.generateMagicSquare(boardSize, rng);
		var difficultyToMagicSquareIndex = {};
		for(i = 0; i < magicSquare.length; i++) {
			difficultyToMagicSquareIndex[magicSquare[i]] = i;
		}
		// The magic square represents the layout of the bingo board by difficulty. Now get the order in which to populate it
		function randomizeGenerationOrder() {
			var i;
			var order = [], unusedIndices = {};
			// If there's a middle square, do that first
			// Then do the top (boardSize-1) goals in order, in an effort to minimize the chance of a card overflow
			// Then do the rest in random order
			for(i = 0; i < numSquares; i++) {
				unusedIndices[i] = true;
			}
			// Center square only exists if size is odd
			if(numSquares % 2 == 1) {
				var center = (numSquares - 1) / 2;
				order.push(center);
				delete unusedIndices[center]; 
			}
			// Now iterate over top difficulties
			for(i = numSquares; i > (numSquares-boardSize+1); i--) {
				var indexOfDifficulty = difficultyToMagicSquareIndex[i];
				if(unusedIndices[indexOfDifficulty]) {
					order.push(indexOfDifficulty);
					delete unusedIndices[indexOfDifficulty];
				}
			}
			// Now add the rest
			var unused = Object.keys(unusedIndices).map(function(index) {
				return parseInt(index, 10);
			});
			order = order.concat(randomUtils.shuffle(unused, rng));
			return order;
		}
		var generationOrder = randomizeGenerationOrder();
		
		// Here we go! Populate the card according to the prescribed order
		var card = new Array(numSquares);
		var okay = true;  // Will be set to false if card generation blows up
		for(i = 0; i < generationOrder.length; i++) {
			var indexToPopulate = generationOrder[i];
			okay = populateIndex(indexToPopulate);
			if(!okay) break;
		}

		// Return true if index was successfully populated, false otherwise
		function populateIndex(indexToPopulate) {
			return true;
		}

		// If we succeeded, return the card we got and outer loop will terminate
		if(okay) return card;
	}

	console.log(generatedCard);
	process.exit();
};

module.exports = DSGenerator;
