var Generator = require('./generator');
var util = require('util');

var RIGenerator = function(router) {
	Generator.call(this, router);
};
util.inherits(RIGenerator, Generator);

RIGenerator.prototype.getCard = function(rng) {
	throw new Error('Randomized iterative generator still being thought about, coming soon :)');
};

module.exports = RIGenerator;
