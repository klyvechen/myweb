/**
 * This util somekind inherits the original util.
 * It expand the original util and add some useful api such as clone and others'.
 */

var util = require('util');
var lodash = require('lodash');

// var iterateClone = function (src, tgt) {
//     if (src.isActiveCloning) return;
//     src.isActiveCloning = true;
//     for (let prop in src) {
//         if (src.hasOwnProperty(prop)) {
//             if (typeof(src[prop]) == 'object' && src[prop] != null) {
//                 tgt[prop] = iterateClone(src[prop], {});
//             } else {
//                 tgt[prop] = src[prop];
//             }
//         }
//     }
//     delete src.isActiveCloning;
//     return tgt;
// }

exports.clone = function (src) {
    // return iterateClone(src, {});
    return lodash.cloneDeep(src);
}

exports = util;
