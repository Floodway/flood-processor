"use strict";
var Cookie = (function () {
    function Cookie() {
    }
    Cookie.parse = function (source) {
        var obj = {};
        var pairs = source.split(/; */);
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split("=");
            if (pair.length >= 2) {
                var key = pair[0].trim();
                var value = pair[1].trim();
                if (obj[key] == null) {
                    try {
                        obj[key] = decodeURIComponent(value);
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
            }
        }
        return obj;
    };
    return Cookie;
}());
exports.Cookie = Cookie;
