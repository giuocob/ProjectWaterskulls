// Note that this interface is highly in flux and will surely change drastically.
var RNG = require('./lib/random-utils').RNG;

// Item lists
var itemLists = {
	'tinytestv1': require('./itemlists/tinytestv1'),
	'old-difficulty-synergy': require('./itemlists/old-difficulty-synergy')
};

// Routers
var routers = {
	'cartesian': require('./routers/cartesian'),
	'single-execution-path': require('./routers/single-execution-path')
};

// Generators
var generators = {
	'randomized-iterative': require('./generators/randomized-iterative'),
	'difficulty-synergy': require('./generators/difficulty-synergy')
};


// Main function to do just about anything.
// Opts are:
//   generator: the name of the generator to use
//   router: the name of the router to use, if any
//   itemList: the name of the itemlist to use
//   seed: the seed used to generate the card, will be randomly selected if omitted
//   generatorOpts: object of generator-specific options
// Throws when you send bad arguments, naturally
exports.generateCard = function(opts) {
	if(!opts) opts = {};
	if(!opts.itemList) throw new Error('itemList is a required option');
	if(!itemLists[opts.itemList]) throw new Error('Specified itemList is invalid');
	var itemList = itemLists[opts.itemList];

	if(!opts.generator) throw new Error('generator is a required option');
	if(!generators[opts.generator]) throw new Error('Specified generator is invalid');
	var Generator = generators[opts.generator];

	// Construct a router, if we need one
	var router;
	if(Generator.requiresRouter) {
		if(!opts.router) throw new Error('Specified generator requires a router');
		if(!routers[opts.router]) throw new Error('Specified router is invalid');
		var Router = routers[opts.router];
		router = new Router(itemList);
	} else {
		if(opts.router) throw new Error('Specified generator does not accept a router');
	}

	var generator = new Generator({
		router: router,
		itemList: itemList
	});

	var rng;
	if(opts.seed !== undefined) {
		var seed = opts.seed;
		if(typeof seed != 'number') {
			seed = parseInt(seed, 10);
			if(isNaN(seed)) throw new Error('Specified seed is not a number');
		}
		if(seed % 1 !== 0 || seed < 1 || seed > 1000000) throw new Error('Seed must be an integer between 1 and 1000000');
		rng = new RNG(seed);
	} else {
		rng = new RNG();
	}

	var generatorOpts = opts.generatorOpts || {};
	var card = generator.getCard(rng, generatorOpts);
	return card;
};

// Generate an old-style difficulty-synergy card using the stored item list
// Opts can include size and seed
exports.generateDifficultySynergyCard = function(opts) {
	if(!opts) opts = {};
	var card = exports.generateCard({
		itemList: 'old-difficulty-synergy',
		generator: 'difficulty-synergy',
		seed: opts.seed,
		generatorOpts: {
			size: opts.size
		}
	});
	return card;
};
