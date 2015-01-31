var seedrandom = require('seedrandom');

// For consistency, this should be used for any and all random operations within waterskulls
var RNG = function(seed) {
	if(seed === undefined) seed = Math.floor(Math.random() * 1000000);

	this.seed = seed;
	this.random = seedrandom(seed);
};

// Get next random float from internal seeded rng
RNG.prototype.random = function() {
	return this.random();
};

// Get random integer between low and high, inclusive
RNG.prototype.randomInt = function(low, high) {
	if(low % 1 !== 0 || high % 1 !== 0 || high < low) throw new Error('Silly usage of RNG');
	var range = high - low + 1;
	return Math.floor(this.random() * range) + low;
};

// Get random float between low and high
RNG.prototype.randomFloat = function(low, high) {
	if(high < low) throw new Error('Silly usage of RNG');
	var range = high - low;
	return (this.random() * range) + low;
};

exports.RNG = RNG;

// Uniformly shuffle an array. Will not mutate original. Give it an RNG or it will make one for you.
function shuffle(arr, rng) {
	arr = arr.slice();
	if(!rng) rng = new RNG();
	for(var i = 0; i < arr.length; i++) {
		var toSwap = rng.randomInt(i, arr.length - 1);
		var tmp = arr[i];
		arr[i] = arr[toSwap];
		arr[toSwap] = tmp;
	}
	return arr;
}
exports.shuffle = shuffle;
