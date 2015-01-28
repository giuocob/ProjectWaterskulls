var Handlebars = require('handlebars');
var cardUtils = require('../../lib/card-utils');
var fs = require('fs');

// Board is an array of length size^2, where each element is an object that should have a name property
exports.renderBingoPage = function(board, cb) {
	fs.readFile('test/server/html/bingo-board.html', function(error, page) {
		if(error) return cb(error);
		var template = Handlebars.compile(page.toString());
		var html = template(board);
		cb(null, html);
	});
};

Handlebars.registerHelper('bingoBoard', function(size, goals) {
	var rowSquareMap = cardUtils.constructRowSquareMap(size);
	var squareRowMap = cardUtils.invertRowSquareMap(rowSquareMap);
	
	// Buncha helper functions
	function writeTd(id, classArray, content) {
		var ret = '<td class=\"';
		for(var classIndex = 0; classIndex < classArray.length; classIndex++) {
			ret += classArray[classIndex];
			if(classIndex != classArray.length-1) ret += ' ';
		}
		ret += '\" id=\"' + id + '\">';
		ret += Handlebars.escapeExpression(content);
		ret += '</td>\n';
		return ret;
	}

	function writeTlbr() {
		return writeTd('tlbr', [], 'TL-BR');
	}

	function writeBltr() {
		return writeTd('bltr', [], 'BL-TR');
	}

	function writeRow(rowNum) {
		rowNum++;
		return writeTd('row'+rowNum, [], 'ROW'+rowNum);
	}

	function writeColumn(colNum) {
		colNum++;
		return writeTd('col'+colNum, [], 'COL'+colNum);
	}

	function writeSlot(slotNum, content) {  // 0 to size^2-1
		slotNum++;
		return writeTd('slot'+slotNum, [], content);
	}

	var tableRow, tableColumn;
	var html = '';
	// First row: write tlbr then all column headers
	html += '<tr>\n';
	html += writeTlbr();
	for(tableColumn = 0; tableColumn < size; tableColumn++) {
		html += writeColumn(tableColumn);
	}
	html += '</tr>\n';
	// Now do the rows
	for(tableRow = 0; tableRow < size; tableRow++) {
		html += '<tr>\n';
		html += writeRow(tableRow);
		for(tableColumn = 0; tableColumn < size; tableColumn++) {
			var slot = tableRow * size + tableColumn;
			html += writeSlot(slot, goals[slot].name);
		}
		html += '</tr>\n';
	}
	// Now lonely bltr
	html += '<tr>\n';
	html += writeBltr();
	html += '</tr>';

	return html;
});