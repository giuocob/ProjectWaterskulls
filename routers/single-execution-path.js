// Validate the item list
function preprocess(itemList, cb) {
	var validated = {};
	if(!Array.isArray(itemList)) return cb(new Error('Did not understand item list: must be an array of goals'));
	for(var i=0;i<itemList.length;i++) {
		var item = itemList[i];
		if(!item.id || typeof item.id != 'string') return cb(new Error('All items must have an id'));
		if(item.id.length === 0 || item.id[0] == '_') return cb(new Error(item.id + ' is a reserved keyword'));
		if(validated[item.id]) return cb(new Error('Nonunique item id: ' + item.id));
		var itemObject = {};
		itemObject.payload = item.payload || {};
		if(typeof itemObject.payload != 'object') return cb(new Error('Data payload must be an object'));
		itemObject.payload.id = item.id;
		if(!item.executionPaths || !Array.isArray(item.executionPaths) || item.executionPaths.length === 0) {
			return cb(new Error('Missing execution paths array on item with id: ' + item.id));
		}
		itemObject.executionPaths = [];
		for(var k=0;k<item.executionPaths.length;k++) {
			var executionPath = item.executionPaths[k];
			var validatedExecutionPath = { dependencies: [] };
			if(!executionPath.time || typeof executionPath.time != 'number' || executionPath.time < 0) {
				return cb(new Error('Missing or invalid time in execution path in item with id: ' + item.id));
			}
			validatedExecutionPath.time = executionPath.time;
			if(executionPath.dependencies && !Array.isArray(executionPath.dependencies)) return cb(new Error('Execution path must be an array'));
			if(!executionPath.dependencies || executionPath.dependencies.length === 0) {
				validatedExecutionPath.dependencies = [ '_base' ];
			} else {
				for(var m=0;m<executionPath.dependencies.length;m++) {
					if(typeof executionPath.dependencies[m] != 'string') return cb(new Error('Dependency array entries must be strings'));
					validatedExecutionPath.dependencies.push(executionPath.dependencies[m]);
				}
			}
			itemObject.executionPaths.push(validatedExecutionPath);
		}
		validated[item.id] = itemObject;
	}

	// Need to check whether formed item list is a valid graph; that's for another day
	cb(null, validated);
}

// The routing logic
function getFullRoute(rawItemList, goalIds, cb) {
	if(goalIds.length === 0) return cb(new Error('No goals given to route calculator'));
	preprocess(rawItemList, function(error, itemList) {
		if(error) return cb(error);

		// Make sure passed in item ids are actually item ids
		for(var i=0;i<goalIds.length;i++) {
			if(!itemList[goalIds[i]]) return cb(new Error('Goal id: ' + goalIds[i] + ' not present in item list'));
		}
		// Add fake goal to the item list representing the final 'done' state
		itemList._done = {
			name: '_done',
			executionPaths: [
				{
					time: 0,
					dependencies: goalIds.slice()
				}
			]
		};
		// Add fake goal to the item list for the base goal with no dependencies
		itemList._base = {
			name: '_base',
			executionPaths: []
		};

		// Perform time calculation algorithm
		// For now, we just have the simple case where each goal has one execution path, and we assume no cycles
		// For each item, we will perform a DFS on that item's execution path and stop the search when we hit goals that are already included in the route

		// Items that have already been processed and will be part of the route
		var route = { _done: true };
		// Stack for the depth first search. Entries include the id of the goal currently being processed and a cursor indicating the search position in the dependency array
		var dfsStack = [ { id: '_done', cursor: 0 } ];

		while(dfsStack.length > 0) {
			var searchEntry = dfsStack[dfsStack.length-1];
			var goal = itemList[searchEntry.id];
			if(goal.executionPaths.length === 0) {
				// Base goal with no dependencies
				dfsStack.pop();
				continue;
			}
			var dependencyArray = goal.executionPaths[0].dependencies;
			if(searchEntry.cursor >= dependencyArray.length) {
				// This item has been fully processed; pop it
				dfsStack.pop();
				continue;
			}
			var newGoalId = dependencyArray[searchEntry.cursor];
			searchEntry.cursor++;
			// Add new goal id to the dfs stack, unless it is already in the route
			if(!route[newGoalId]) {
				dfsStack.push({ id: newGoalId, cursor: 0 });
				route[newGoalId] = true;
			}
		}

		// Route has everything we need
		var retObject = { goals: [], time: 0 };
		Object.keys(route).forEach(function(goalId) {
			if(goalId[0] == '_') return;
			retObject.goals.push(itemList[goalId].payload);
			retObject.time += itemList[goalId].executionPaths[0].time;
		});

		cb(null, retObject);
	});
}

function getTime(itemList, goalIds, cb) {
	getFullRoute(itemList, goalIds, function(error, route) {
		if(error) return cb(error);
		cb(null, route.time);
	});
}

exports.preprocess = preprocess;
exports.getFullRoute = getFullRoute;
exports.getTime = getTime;
