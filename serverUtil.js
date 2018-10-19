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

serverfiles.forEach(function (filename) {
    filesMap(filename);
    fs.watch(filename, function () {
        filesMap(filename);
    })
})

var replaceTag = function (html) {
    // The includes is not a Array, so it cannot
    var renderHtml = util.clone(html);
    var includes = renderHtml.getElementsByTagName('include');
    for (; includes.length > 0;) {
        var include = includes[0];
        var newHtml = util.clone(htmls['./' + include.getAttribute('ref')].firstChild);
        if (newHtml.getElementsByTagName('include')) 
            newHtml = replaceTag(newHtml);
        renderHtml.replaceChild(newHtml, include);    
        fs.watch('./' + include.getAttribute('ref'), function () {
            replaceTag(html);
        });
    }
    return renderHtml;
}

exports.createHTTPServer = function () {
    return http.createServer(function (req, res) {
        var url = req.url;
        if (url == '/')
            url = '/index.html';
        var html = htmls['.' + url];
        res.writeHeader(200, { "Content-Type": "text/html" });
        
        if(html) {
            if (html.getElementsByTagName('include'))
                html = replaceTag(html);// 這邊使用lib要使用更彈性的方式做變換
            res.write(html.toString());
        }
        
            
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
