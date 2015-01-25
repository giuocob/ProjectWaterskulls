// Usage: node test/print-route.js -r <router> -i <itemlist> -s <seed> <goalid>...
// Example: node test/print-route.js -r single-execution-path -i tinytestv1 kokirisword enterdeku
// All parameters have defaults, but at least one goalId must be provided.
var args = require('minimist')(process.argv.slice(2));

function run() {
	var defaults = {
		itemList: 'tinytestv1',
		router: 'single-execution-path'
	};
	if(args._.length === 0) throw new Error('Usage: node test/print-route.js -r <router> -i <itemlist> <goalid>...');
	var itemListName = args.i || defaults.itemList;
	var routerName = args.r || defaults.router;
	var itemList, Router;
	try {
		itemList = require('../itemlists/' + itemListName);
	} catch(e) {
		throw new Error('Failed to load item list: ' + itemListName);
	}
	try {
		Router = require('../routers/' + routerName);
	} catch(e) {
		throw new Error('Failed to load router: ' + routerName);
	}

	var routerInstance = new Router(itemList);
	var goalIds = args._;
	return routerInstance.getFullRoute(goalIds);
}

var result = run();
console.log(JSON.stringify(result,null,4));
console.log('OK');
