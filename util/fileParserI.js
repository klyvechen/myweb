var HTMLParser = require('node-html-parser');
var xmlDomParser = require('./xmlDomParser');

// var parser = HTMLParser;
var parser = xmlDomParser;

exports.parse = function(file) {
    return parser.parse(file);
}