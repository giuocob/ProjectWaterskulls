// Usage: node test/print-card.js -r <router> -g <generator> -i <itemlist> -s <seed>
// Example: node test/print-card.js -r cartesian -g randomized-iterative -i tmp/cartesian -s 123456
// All parameters have defaults.
var args = require('minimist')(process.argv.slice(2));

function run(cb) {
	// As of this comment, the test cartesian item list is the only one with a working router, so...
	var defaults = {
		itemList: 'tmp/cartesian',
		router: 'cartesian',
		generator: 'randomized-iterative',
		seed: Math.floor(Math.random() * 1000000)
	};
	var itemListName = args.i || defaults.itemList;
	var routerName = args.r || defaults.router;
	var generatorName = args.g || defaults.generator;
	var itemList, router, generator;
	try {
		itemList = require('../itemlists/' + itemListName);
	} catch(e) {
		return cb(new Error('Failed to load item list: ' + itemListName));
	}
	try {
		router = require('../routers/' + routerName);
	} catch(e) {
		return cb(new Error('Failed to load router: ' + routerName));
	}
	try {
		generator = require('../generators/' + generatorName);
	} catch(e) {
		return cb(new Error('Failed to load generator: ' + generatorName));
	}

	var seed = args.s || defaults.seed;
	if(typeof seed != 'number') {
		seed = parseInt(seed, 10);
		if(isNaN(seed)) return cb(new Error('Seed provided is not a number'));
	}
	seed = Math.floor(seed);

	generator.getCard(router, itemList, seed, function(error, result) {
		if(error) return cb(error);
		cb(null, result);
	});
}

run(function(error, result) {
	if(error) return console.log(error);
	console.log(JSON.stringify(result,null,4));
	console.log('OK');
});
