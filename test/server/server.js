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
var waterskulls = require('../../waterskulls');

// Display an old difficulty-synergy card.
// Accepts size (3-7) and seed as optional parameters.
app.get('/difficulty-synergy', function(req, res, next) {
	var params = {};
	var seed, size;
	if(req.query.size) params.size = parseInt(req.query.size, 10);
	if(req.query.seed !== undefined) params.seed = req.query.seed;
	var card;
	try {
		card = waterskulls.generateDifficultySynergyCard(params);
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
