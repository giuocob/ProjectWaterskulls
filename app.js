

function checkRow(itemList, goalIds, cb) {

	// Ensure the item list is in acceptable format and transform it how we want it. This chunk should be pretty reusable,
	// and will probably get cool stuff like cycle detection eventually
	function validateItemList(itemList, cb) {
		var validated = {};
		if(!Array.isArray(itemList)) return cb('Did not understand item list: must be an array of goals');
		for(var i=0;i<itemList.length;i++) {
			var item = itemList[i];
			if(!item.id || typeof item.id != 'string') return cb('All items must have an id');
			if(item.id == '_base') return cb(item.id + ' is a reserved keyword');
			if(validated[item.id]) return cb('Nonunique item id: ' + item.id);
			var itemObject = {};
			if(item.name && typeof item.name != 'string') return cb('Item name must be a string');
			itemObject.name = item.name || item.id;
			if(!item.executionPaths || !Array.isArray(item.executionPaths) || item.executionPaths.length === 0) return cb('Missing execution paths array on item with id: ' + item.id);
			itemObject.executionPaths = [];
			for(var k=0;k<item.executionPaths.length;k++) {
				var executionPath = item.executionPaths[k];
				var validatedExecutionPath = { dependencies: [] };
				if(!executionPath.time || typeof executionPath.time != 'number' || executionPath.time < 0) return cb('Missing or invalid time in execution path in item with id: ' + item.id);
				validatedExecutionPath.time = executionPath.time;
				if(executionPath.dependencies && !Array.isArray(executionPath.dependencies)) return cb('Execution path must be an array');
				if(!executionPath.dependencies || executionPath.dependencies.length === 0) {
					validatedExecutionPath.dependencies = '_base';
				} else {
					for(var m=0;m<executionPath.dependencies.length;m++) {
						if(typeof executionPath.dependencies[m] != 'string') return cb('Dependency array entries must be strings');
						validatedExecutionPath.dependencies.push(executionPath.dependencies[m]);
					}
				}
				itemObject.executionPaths.push(validatedExecutionPath);
			}
			validated[item.id] = itemObject;
		}

		// Need to check whether formed item list is a valid graph; that's for a nother day
		cb(null, validated);
	}

	validateItemList(itemList, cb);
}

function run(cb) {
	if(process.argv.length < 4) return cb('Usage: node app.js <goallist> <goalid>...');
	var itemListName = process.argv[2];
	var itemList;
	try {
		itemList = require('./itemlists/'+itemListName);
	} catch(e) {
		return cb('Failed to load item list: ' + itemListName + '\n' + JSON.stringify(e,null,4));
	}
	var goalIds = process.argv.slice(3);
	checkRow(itemList, goalIds, cb);
}

run(function(error, result) {
	if(error) return console.log(error);
	console.log(JSON.stringify(result,null,4));
	console.log('Done');
});
