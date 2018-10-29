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
var renderHtmls = {};
var serverfiles = [];
var events = require('events');
var EventEmitter = events.EventEmitter;
var phaseController = {};

//build phase cycle
(function () {
    var PhaseController = function () {
        EventEmitter.call(this);
        this.phases = {}
        this.runPhase = function () {
            this.emit.apply(this, arguments);
        }
        this.registerPhase = function (phaseName, callback) {
            this.on(phaseName, callback);
        }
    };
    util.inherits(PhaseController, EventEmitter);
    phaseController = new PhaseController();
})()

// build a hashmap for store the html page(all the html page are view)
phaseController.registerPhase('buildFiles', function () {
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
});

phaseController.registerPhase('composeFiles', function (req, res) {
/**
 * @param {Document} html
 * @param {Object} elements
 * @return {Document}
 */
var replaceContentTag = function (html, elements) {
    var contentTags = html.getElementsByTagName('content');
    for(var j = 0 ;j < elements.length; j++) {
        html.insertBefore(elements.item(0), contentTags[0]);
    }
    if (contentTags[0])
        html.removeChild(contentTags[0]);
    return html;
}

/**
 * @param {Document} html
 * @param {Object} elements
 * @return {Document}
 */
var replaceIncludeTag = function (html) {
    // The includes is not a Array, so it cannot
    var renderHtml = util.clone(html);
    var includeTags = renderHtml.getElementsByTagName('include');
    var includeTagsLength = includeTags.length;
    // In replaceChild will change the length of the includes, so we do until the include go to zero.
    for (var i = 0; i < includeTagsLength; i++) {
        var includeTag = includeTags[i];
        var includeChildren = util.clone(includeTag.childNodes);
        var includeHtml;
        if (includeHtml = htmls['./' + includeTag.getAttribute('ref')]) {
            var renderIncludeHtml = util.clone(includeHtml);
            //Document, List<Element>
            replaceContentTag(renderIncludeHtml, includeChildren);
            //Document
            renderIncludeHtml = loadHtml(renderIncludeHtml);
            for (var j = 0; j < renderIncludeHtml.childNodes.length; j++) {
                renderHtml.insertBefore(renderIncludeHtml.childNodes[j], includeTag);
            }
            renderHtml.removeChild(includeTag);
            fs.watch('./' + includeTag.getAttribute('ref'), function () {
                replaceIncludeTag(html);
            });
        }
    }
    return renderHtml;
}

/**
 * @param: Document html
 * @return: Document
 */
var loadHtml = function (html) {
    if (html.getElementsByTagName('include'))
        return replaceIncludeTag(html);// 這邊使用lib要使用更彈性的方式做變換
}

var url = req.url;
if (url == '/')
    url = '/index.html';
var html = htmls['.' + url];
res.writeHeader(200, { "Content-Type": "text/html" });

if(html) {
    html = loadHtml(html);
    res.write(html.toString());
}
});

phaseController.registerPhase('initModel',function (initModel){
    initModel();
})

phaseController.runPhase('buildFiles');
exports.createHTTPServer = function (c) {
    return http.createServer(function (req, res) {       
        phaseController.runPhase('composeFiles', req, res);
        phaseController.runPhase('initModel', c.initModel);           
        phaseController.runPhase('end', req, res);

        req.on('data', function (chunk) {
            console.log('parsed', chunk);
        })
        req.on('end', function () {
            console.log('done');
            res.end();
        });
    });
};

exports.getPhaseController = function () {
    return phaseController;
}