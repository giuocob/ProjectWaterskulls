// This is meant to be run on the output up generate-cartesian-itemlist.
// Its purpose is to be a simple, accurate, fast router to test card generators.

var Router = require('./router');
var util = require('util');

var CartesianRouter = function(itemList) {
	Router.call(this, itemList);
};
util.inherits(CartesianRouter, Router);

CartesianRouter.prototype.getFullRoute = function(goalIds) {
	var itemList = this.itemList;
	var itemMap = {};
	if(itemList.cardType != 'cartesian') throw new Error('This router requires a cartesian card');
	itemList.items.forEach(function(item) {
		itemMap[item.id] = item;
	});
	// Travelling salesman! Yay! (We're getting tiny inputs, so just brute force it)
	function cartesianDistance(a,b) {
		return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
	}

	// This runs once per permutation
	var bestPermutation, bestTime;
	function calculateRoute(permutation) {
		// permutation is an array containing 0...(n-1)
		var cumulative = 0;
		var current = { x: 0, y: 0 };   // Start at 0,0 always
		for(var i=0; i<permutation.length; i++) {
			var itemId = goalIds[permutation[i]];
			var item = itemMap[itemId];
			if(!item) throw new Error('itemId ' + itemId + ' not present in item list');
			cumulative += cartesianDistance(current, item);
			current = item;
		}
		if(bestTime === undefined || cumulative < bestTime) {
			bestTime = cumulative;
			bestPermutation = permutation;
		}
	}

	try {
		// Now iterate over all possible permutations
		var startingPermutation = [];
		for(var i=0; i<goalIds.length;i++) {
			startingPermutation.push(i);
		}
		var current = startingPermutation;
		while(true) {
			calculateRoute(current);
			// Now get next permutation, aka the fun bit
			var currentIndex = current.length-1;
			while(true) {
				currentIndex--;
				if(currentIndex < 0) break;
				if(current[currentIndex] < current[currentIndex+1]) break;
			}
			if(currentIndex < 0) break;  // We are done
			// Swap the value at currentIndex and the smallest value above it that is still bigger than currentIndex
			var swapIndexCandidate = currentIndex + 1;
			for(var k=swapIndexCandidate+1; k<current.length; k++) {
				if(current[k] > current[currentIndex] && current[k] < current[swapIndexCandidate]) {
					swapIndexCandidate = k;
				}
			}
			// Swap em
			var temp = current[currentIndex];
			current[currentIndex] = current[swapIndexCandidate];
			current[swapIndexCandidate] = temp;
			// Now sort everything above currentIndex
			current = current.slice(0,currentIndex+1).concat(current.slice(currentIndex+1).sort());
		}
	} catch(error) {
		throw error;
	}

	// bestTime and bestPermutation contain the winners
	var goals = [];
	bestPermutation.forEach(function(permutationIndex) {
		var payload = itemMap[goalIds[permutationIndex]].payload || {};
		payload.id = itemMap[goalIds[permutationIndex]].id;
		goals.push(payload);
	});
	return {
		goals: goals,
		time: bestTime
	};
};

CartesianRouter.prototype.getTime = function(goalIds) {
	var route = getFullRoute(goalIds);
	return route.time;
};

module.exports = CartesianRouter;
