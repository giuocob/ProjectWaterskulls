var Generator = require('./generator');
var util = require('util');
var cardUtils = require('../lib/card-utils');

var defaultBoardSize = 5;

var RIGenerator = function(opts) {
	Generator.call(this, opts);
};
util.inherits(RIGenerator, Generator);

RIGenerator.requiresRouter = true;

RIGenerator.prototype.getCard = function(rng, opts) {
	if(!opts) opts = {};
	var boardSize = opts.size || defaultBoardSize;
	if(boardSize < 2 || boardSize > 7) throw new Error('Provided boardSize is out of range');
	var worker = new Worker(this.router, rng, boardSize);
	var generated = worker.generate();
	return generated;
};


// Internal worker class for RIGenerator; does the actual work
var Worker = function(router, rng, boardSize) {
	this.router = router;
	this.rng = rng;
	this.boardSize = boardSize;
	this.rowSquareMap = cardUtils.constructRowSquareMap(boardSize);
};

Worker.prototype.generate = function() {
	throw new Error('Nothing here yet');
};

module.exports = RIGenerator;
