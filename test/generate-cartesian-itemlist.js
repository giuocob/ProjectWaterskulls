// Make a quick 'n simple itemlist out of random cartesian pairs, for use by the cartesian test router.
// The filename can be given via command line. Resulting item list will be in itemlists/tmp (so we can gitignore it)
var fs = require('fs');
var args = require('minimist')(process.argv.slice(2));

function run(cb) {
	var path = __dirname + '/../itemlists/tmp';
	var defaults = {
		filename: 'cartesian.json'
	};
	var filename = args._[0] || defaults.filename;
	if(!fs.existsSync(path)) fs.mkdirSync(path);

	//Uniform distribution from 0 to 100 for now
	function uniform() {
		var rnd = Math.random() * 100;
		return Math.round(rnd * 100) / 100;   // Round to 2 decimal places
	}
	var getX = uniform, getY = uniform;

	var itemCount = 100;
	var itemListMap = {};
	for(var i=0; i<itemCount; i++) {
		var item, itemId;
		do {
			item = {
				x: getX(),
				y: getY()
			};
			item.payload = {
				name: '(' + item.x + ', ' + item.y + ')'
			};
			itemId = item.x + '-' + item.y;
		} while(itemListMap[itemId]);   // Ensure uniqueness
		itemListMap[itemId] = item;
	}

	var itemList = [];
	var idCounter = 0;
	Object.keys(itemListMap).forEach(function(itemId) {
		itemList.push(itemListMap[itemId]);
		itemListMap[itemId].id = idCounter.toString();
		idCounter++;
	});
	fs.writeFile(path + '/' + filename, JSON.stringify(itemList,null,4), cb);
}
run(function(error) {
	if(error) return console.log(error);
	console.log('OK');
});