// read each line of index.txt, add to json array, output to index.json

var fs = require('fs');
var path = require('path');

var index = fs.readFileSync(path.join(__dirname, 'index.txt'), 'utf8');
var lines = index.split('\n')
var json = [];

lines.forEach(function(line) {
    json.push(JSON.parse(line))
});

fs.writeFileSync(path.join(__dirname, 'index.json'), JSON.stringify(json, null, 2), 'utf8');
