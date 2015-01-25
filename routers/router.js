var Router = function(itemList) {
	this.itemList = itemList;
};

Router.prototype.getItemList = function() {
	return this.itemList;
};

// Override this
Router.prototype.getFullRoute = function(goalIds, rng) {
	throw new Error('getFullRoute not supported by this router');
};

// And this
Router.prototype.getTime = function(goalIds, rng) {
	throw new Error('getTime not supported by this router');
};

module.exports = Router;
