var Generator = require('./generator');
var util = require('util');
var cardUtils = require('../lib/card-utils');
var randomUtils = require('../lib/random-utils');
var extend = require('extend');
var stableSort = require('stable');

var defaultBoardSize = 5;

var DSGenerator = function(opts) {
	Generator.call(this,opts);
	if(!this.itemList || this.itemList.cardType != 'difficulty-synergy') throw new Error('itemList must have a type of difficulty-synergy');
};
util.inherits(DSGenerator, Generator);

DSGenerator.requiresRouter = false;

// Allowed opts:
//   size: Size of board between 3 and 7, inclusive. Default is 5.
//   returnFullGoals: If true, ful goal data will be returned instead of the truncated versions.
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
	if((3 * numSquares) > goals.length) throw new Error('Goal list is too short for this board size');
	// Item difficulties are hard-coded as 1-25. Since we're supporting multiple board sizes, the easiest way will be to sort the goal list
	// by difficulty, scale it linearly, and return requested slices.
	goals = stableSort(goals, function(a,b) {
		// For absolute sort, sort by difficulty, then id
		var aDiff = a.difficulty || 0, bDiff = b.difficulty || 0;
		if(aDiff < bDiff) return -1;
		else if(aDiff > bDiff) return 1;
		else return 0;
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

	// Keep trying to generate card until one sticks, or limit is reached
	var remainingTries = 10;
	var generatedCard;
	while(!generatedCard) {
		if(remainingTries <= 0) throw new Error('Number of allowed attempts for card generation exceeded');
		remainingTries--;
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
			var currentDifficulty = magicSquare[indexToPopulate];
			// Allow difficulty bumps as long as they dont top the goal list
			while(currentDifficulty <= numSquares) {
				var candidateGoals = randomUtils.shuffle(getGoalsAtDifficulty(currentDifficulty), rng);
				var candidateGoalIndex, rowNameIndex;
				var goalFound = false;
				for(candidateGoalIndex = 0; candidateGoalIndex < candidateGoals.length; candidateGoalIndex++) {
					var candidateGoal = candidateGoals[candidateGoalIndex];
					// Test-insert the selected goal into the card
					card[indexToPopulate] = candidateGoal;
					var goalConflicts = false;
					// Now check all related rows
					for(rowNameIndex = 0; rowNameIndex < (squareRowMap[indexToPopulate] || []).length; rowNameIndex++) {
						var rowName = squareRowMap[indexToPopulate][rowNameIndex];
						var rowIsOkay = checkRow(rowName);
						if(!rowIsOkay) {
							goalConflicts = true;
							break;
						}
					}
					if(!goalConflicts) {
						// We got a goal! Accept it and terminate loop
						goalFound = true;
						break;
					}
				}
				// If a goal was found, terminate loop. Otherwise, try next difficulty.
				if(goalFound) {
					return true;
				} else {
					currentDifficulty++;
				}
			}
			// If we're here, goal selection topped out and we failed.
			return false;
		}

		// Check a row in the current card state.
		// Return true if there are no synergy conflicts, and false otherwise.
		function checkRow(rowName) {
			var presentTypes = {}, presentSubtypes = {};
			var i, typeIndex, subtypeIndex;
			var allowedChildGoals = boardSize-1;  // Disallow the case where all goals in a row are child only
			for(i = 0; i < rowSquareMap[rowName].length; i++) {
				var currentIndex = rowSquareMap[rowName][i];
				var currentGoal = card[currentIndex];
				if(!currentGoal) continue;
				if(currentGoal.child) allowedChildGoals--;
				// Add and check against goal's types and subtypes
				if(currentGoal.subtypes) {
					for(subtypeIndex = 0; subtypeIndex < currentGoal.subtypes.length; subtypeIndex++) {
						var subtype = currentGoal.subtypes[subtypeIndex];
						presentSubtypes[subtype] = true;
					}
				}
				if(currentGoal.types) {
					for(typeIndex = 0; typeIndex < currentGoal.types.length; typeIndex++) {
						var type = currentGoal.types[typeIndex];
						// Fail if there is a conflict either between types or between a type and subtype
						if(presentTypes[type]) return false;
						if(presentSubtypes[type]) return false;
						presentTypes[type] = true;
					}
				}
			}
			if(allowedChildGoals < 0) return false;  // All-child row
			return true;
		}

		// If we succeeded, return the card we got and outer loop will terminate
		if(okay) return card;
	}

	// We got a card! Transform it to output format and return
	var retCard = generatedCard.map(function(goal) {
		if(opts.returnFullGoals) {
			return extend(true, {}, goal);
		} else {
			return {
				id: goal.id,
				name: (goal.payload && goal.payload.name) || goal.id
			};
		}
	});
	return {
		goals: retCard
	};
};

module.exports = DSGenerator;
