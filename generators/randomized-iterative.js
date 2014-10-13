function getCard(router, itemList, seed, cb) {
	if(typeof router.getTime != 'function') return cb(new Error('Invalid router'));
	cb(new Error('Randomized iterative generator still being thought about, coming soon :)'));
}

exports.getCard = getCard;
