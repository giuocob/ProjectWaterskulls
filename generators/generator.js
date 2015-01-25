var Generator = function(router) {
	this.router = router;
};

Generator.prototype.getRouter = function() {
	return this.router;
};

Generator.prototype.getItemList = function() {
	return this.getRouter().getItemList();
};

// Override this
Generator.prototype.getCard = function(rng) {
	throw new Error('getCard not supported by this generator');
};

module.exports = Generator;
