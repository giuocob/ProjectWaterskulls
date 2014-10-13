// Usage: node test/print-route.js -r <router> -i <itemlist> -s <seed> <goalid>...
// Example: node test/print-route.js -r single-execution-path -i tinytestv1 kokirisword enterdeku
// All parameters have defaults, but at least one goalId must be provided.
var args = require('minimist')(process.argv.slice(2));

function run(cb) {
	var defaults = {
		itemList: 'tinytestv1',
		router: 'single-execution-path'
	};
	if(args._.length === 0) return cb(new Error('Usage: node test/print-route.js -r <router> -i <itemlist> <goalid>...'));
	var itemListName = args.i || defaults.itemList;
	var routerName = args.r || defaults.router;
	var itemList, router;
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

	var goalIds = args._;
	if(typeof router.getFullRoute != 'function') return cb(new Error('Router does not expose function getFullRoute'));
	router.getFullRoute(itemList, goalIds, cb);
}

run(function(error, result) {
	if(error) return console.log(error);
	console.log(JSON.stringify(result,null,4));
	console.log('OK');
});