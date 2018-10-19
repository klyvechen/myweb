/**
 * Filename: serverUtil.js
 * The serverUtil.js is mainly for create a http server and automatically traversing all the path in the server,
 * and build up a fileMap for the server to render the html which the request want to show.
 */

var http = require('http');
var fs = require('fs');
var fileParser = require('./util/fileParserI');
var util = require('./util/util.js');
var htmls = {};
var serverfiles = [];

var buildServerFile = function (path) {
    var files = fs.readdirSync(path);
    files.forEach(function (fp) {
        fp = path + fp;
        if (fs.lstatSync(fp).isDirectory()) {
            buildServerFile(fp + '/');
        } else {
            serverfiles.push(fp);
        }
    })
}

var filesMap = function (filename) {
    if (!filename.match(/.*\.html/))
        return;
    fs.readFile(filename, 'utf8', function (err, html) {
        htmls[filename] = fileParser.parse(html);
        if (err) {
            throw err;
        }
    });
}

buildServerFile('./');

serverfiles.forEach(function (file) {
    filesMap(file);
    fs.watch(file, function () {
        filesMap(file);
    })
})

var composeHTML = function (outterHTML, innerHTML, targetTag) {
}

exports.createHTTPServer = function () {
    return http.createServer(function (req, res) {
        var url = req.url;
        if (url == '/')
            url = '/index.html';
        var html = htmls['.' + url];
        res.writeHeader(200, { "Content-Type": "text/html" });
        if (html)
            res.write(html.innerHTML);
        res.end();

        req.on('data', function (chunk) {
            console.log('parsed', chunk);
        })
        req.on('end', function () {
            console.log('done parsing');
            res.end();
        });
    })
};
