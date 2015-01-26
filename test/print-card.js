 // Usage: node test/print-card.js -r <router> -g <generator> -i <itemlist> -s <seed>
// Example: node test/print-card.js -r cartesian -g randomized-iterative -i tmp/cartesian -s 123456
// All parameters have defaults.
var args = require('minimist')(process.argv.slice(2));
var RNG = require('../lib/random-utils').RNG;

function run() {
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
	var itemList, Router, Generator;
	try {
		itemList = require('../itemlists/' + itemListName);
	} catch(e) {
		throw new Error('Failed to load item list: ' + itemListName);
	}
	try {
		Generator = require('../generators/' + generatorName);
	} catch(e) {
		throw new Error('Failed to load generator: ' + generatorName);
	}
	var generatorOpts = {};
	if(Generator.requiresRouter) {
		try {
			Router = require('../routers/' + routerName);
		} catch(e) {
			throw new Error('Failed to load router: ' + routerName);
		}
		generatorOpts.router = new Router(itemList);
	}
	generatorOpts.itemList = itemList;

	var seed = args.s || defaults.seed;
	if(typeof seed != 'number') {
		seed = parseInt(seed, 10);
		if(isNaN(seed)) throw new Error('Seed provided is not a number');
	}
	seed = Math.floor(seed);
	var rng = new RNG(seed);

	var generatorInstance = new Generator(generatorOpts);
	var card = generatorInstance.getCard(rng);
	return card;
}

var result = run();
console.log(JSON.stringify(result,null,4));
console.log('OK');
