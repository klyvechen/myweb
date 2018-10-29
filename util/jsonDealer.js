var fs = require('fs');

var jd = this;
exports.jsonFileConcat = function (object) {
    if (!object)
        return;
    var np = object;
    var pp;
    var keys = Object.keys(np);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (typeof(np[key]) == 'object') {
            pp = np;
            np = np[key];
            this.jsonFileConcat(np);
            np = pp;
        } else if (typeof(np[key]) == 'string' && np[key].match(/.*\.json/)) {
            fs.readFile('./' + np[key], 'utf8', function (err, result) {        
                var child = JSON.parse(result);
                child = jd.jsonFileConcat(child);
                np[key] = child;
                if (err) {
                    throw err;
                }
            });
        }
    }
    return object;
}