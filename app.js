

function checkRow(itemlist, goalIds, cb) {
	return cb(null, 'A cool return value');
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
	console.log('Done');
});