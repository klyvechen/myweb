var domParser = require('xmldom').DOMParser;

exports.parse = function(file) {
    return new domParser().parseFromString(file, 'text/xml');
}