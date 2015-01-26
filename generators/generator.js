// The options object takes either an item list or a router.
// To differentiate, set the variable requiresRouter on the descending class.
// If true, expects router to be set. itemList will be expected regardless.
var Generator = function(opts) {
	if(!opts) opts = {};
	if(this.constructor.requiresRouter) {
		if(!opts.router) throw new Error('This generator requires a router');
		this.router = opts.router;
	}
	if(!opts.itemList) throw new Error('Missing itemList');
	this.itemList = opts.itemList;
};

Generator.prototype.getItemList = function() {
	return this.itemList;
};

// Override this
Generator.prototype.getCard = function(rng) {
	throw new Error('getCard not supported by this generator');
};

module.exports = Generator;
