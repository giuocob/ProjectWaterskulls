var randomUtils = require('./random-utils');
var extend = require('extend');
var stableSort = require('stable');

/*
 * opts:
 *   rng (RNG): The RNG to use; one will be made at random if omitted.
 *   generateChromosome (Function(rng)) <required>: Generate a starting chromosome at random.
 *   fitness (Function(chromosome)) <required>: Evaluate a chromosome's genetic fitness. Returns a number, where higher number = higher fitness.
 *   population (Number): The number of chromosomes per generation. Defaults to 100.
 *   parentsPerChromosome (Number): The number of genetic parents per offspring. Defaults to 2.
 *   crossover (Function(rng, chromosome1, ...)) <required> Mate chromosomes to produce an offspring. The number of argument is equal to crossoverNum.
 *     Don't mutate original chromosomes plz. For convencience, the original chromosomes will have the _fitness key set to their fitness score.
 *   selectionFitnessPercentage (Number): The top percentage of chromosomes to use for crossover. Defaults to 0.2.
 *   fitnessThreshold (Number): If present, the algorithm will stop as soon as a fitness of this size or larger is encountered.
 *   maxGenerations (Number): The maximum number of generations to run. Defaults to 1000.
 *   cleanResult (Boolean): If true, the _fitness on the result will be deleted, returning it as-is.
 * Returns the best found chromosome, with _fitness set to its fitness score.
 */
function runGeneticAlgorithm(opts) {
	if(!opts) opts = {};
	var i, k;
	// Funcs
	var generateChromosome, fitnessFunction, crossoverFunction;
	// Constants
	var rng, population, numToSelect, parentsPerChromosome, fitnessThreshold, maxGenerations, cleanResult;

	// Validate params and set defaults
	rng = opts.rng || new randomUtils.RNG();
	generateChromosome = opts.generateChromosome;
	if(typeof generateChromosome != 'function') throw new Error('Must provide generateChromosome function');
	fitnessFunction = opts.fitness;
	if(typeof fitnessFunction != 'function') throw new Error('Must provide fitnessFunction');
	population = opts.population || 100;
	if(population < 10) throw new Error('Population is too small');
	var selectionFitnessPercentage = opts.selectionFitnessPercentage || 0.2;
	numToSelect = Math.ceil(population * selectionFitnessPercentage);
	if(numToSelect > population) numToSelect = population;
	if(numToSelect < 1) throw new Error('selectionFitnessPercentage is too large');
	parentsPerChromosome = opts.parentsPerChromosome || 2;
	if(parentsPerChromosome < 1 || parentsPerChromosome > numToSelect) throw new Error('parentsPerChromosome is out of range');
	crossoverFunction = opts.crossover;
	if(typeof crossoverFunction != 'function') throw new Error('Must provide crossoverFunction');
	fitnessThreshold = (typeof opts.fitnessThreshold == 'number') ? opts.fitnessThreshold : undefined;
	maxGenerations = opts.maxGenerations || 1000;
	if(maxGenerations < 1) throw new Error('maxGenerations is out of range');
	cleanResult = !!opts.cleanResult;

	// Initialize some state variables
	var currentGeneration = 1;
	var parentChromosomes = [];
	for(i = 0; i < population; i++) {
		parentChromosomes.push(generateChromosome(rng));
	}
	var bestChromosome;
	var currentChromosome;
	// And run the thing
	var algorithmDone = false;
	while(!algorithmDone) {
		// Calculate all fitness scores
		for(i = 0; i < parentChromosomes.length; i++) {
			currentChromosome = parentChromosomes[i];
			currentChromosome._fitness = fitnessFunction(currentChromosome);
			if(bestChromosome === undefined || currentChromosome._fitness > bestChromosome._fitness) {
				if(Array.isArray(currentChromosome)) bestChromosome = extend(true, [], currentChromosome);
				else if(typeof currentChromosome == 'object') bestChromosome = extend(true, {}, currentChromosome);
				else bestChromosome = currentChromosome;
				if(fitnessThreshold === undefined || bestChromosome._fitness >= fitnessThreshold) {
					algorithmDone = true;
				}
			}
		}
		// Sort generation by fitness
		parentChromosomes = stableSort(parentChromosomes, function(a,b) {
			if(b._fitness - a._fitness !== 0) return (b._fitness - a._fitness);
			return 0;
		});
		
		// Start new generation
		var nextGeneration = [];
		// For now, uniformly select sets of parents from the allowable set. Allow duplicates. Maybe change this behavior later.
		for(i = 0; i < population; i++) {
			var parents = [];
			for(k = 0; k < parentsPerChromosome; k++) {
				parents.push(parentChromosomes[rng.randomInt(0, numToSelect)]);
			}
			var newChromosome = crossoverFunction.apply(this, [rng].concat(parents));
			nextGeneration.push(newChromosome);
		}

		parentChromosomes = nextGeneration;
		currentGeneration++;
		if(currentGeneration > maxGenerations) algorithmDone = true;
	}

	if(cleanResult) delete bestChromosome._fitness;
	return bestChromosome;
}

exports.runGeneticAlgorithm = runGeneticAlgorithm;
