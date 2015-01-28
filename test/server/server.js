var args = require('minimist')(process.argv.slice(2));
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var port = args.port || 17888;

app.set('port', port);
app.use(bodyParser.json());

app.get('/', function(req, res, next) {
	res.end('Hi!');
});


var randomUtils = require('../../lib/random-utils');
var difficultySynergyGenerator = require('../../generators/difficulty-synergy');
var bingoRenderer = require('./bingo-renderer');

// Display an old difficulty-synergy card.
// Accepts size (3-7) and seed as optional parameters.
app.get('/difficulty-synergy', function(req, res, next) {
	var generatorParams = {};
	var rng;
	if(req.query.size) generatorParams.size = parseInt(req.query.size, 10);
	if(req.query.seed !== undefined) {
		rng = new randomUtils.RNG(parseInt(req.query.seed, 10));
	} else {
		rng = new randomUtils.RNG();
	}
	var card;
	try {
		var itemList = require('../../itemlists/old-difficulty-synergy');
		var generator = new difficultySynergyGenerator({
			itemList: itemList
		});
		card = generator.getCard(rng, generatorParams);
	} catch(error) {
		return res.status(500).end(error.stack);
	}
	// Make pretty page
	bingoRenderer.renderBingoPage(card, function(error, html) {
		if(error) return res.status(500).end(error.stack);
		res.send(html);
	});
});

app.listen(app.get('port'));
console.log('Server listening on port ' + port);
