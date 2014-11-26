var http = require('http'),
    fs = require('fs');

var MyUtil = function() {};

MyUtil.prototype.get = function(options, callback) {
    var req = http.get(options, function(res) {
        if (options.debug) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
        }

        // Buffer the body entirely for processing as a whole.
        var bodyChunks = [];
        res.on('data', function(chunk) {
            // process streamed parts here...
            bodyChunks.push(chunk);
        }).on('end', function() {
            var body = Buffer.concat(bodyChunks);
            if (options.debug) {
                console.log('BODY: ' + body);
            }

            if (options.jsonp) {
                if (options.debug) {
                    console.log('jsonp');
                };

                var str = body.toString(),
                    index = str.indexOf("(");
                if (index > 0) {
                    global[str.substring(0, index)] = callback;
                    eval(str);
                } else {
                    console.log('JSONP ERROR');
                }

            } else {
                callback(body, res.statusCode);
            }
        });
    });

    req.on('error', function(e) {
        console.log('ERROR: ' + e.message);
    });

};

MyUtil.prototype.readlines = function(filePath, callback) {
    var input = fs.createReadStream(filePath);
    var remaining = '';

    input.on('data', function(data) {
        remaining += data;
        var index = remaining.indexOf('\n');
        while (index > -1) {
            var line = remaining.substring(0, index);
            remaining = remaining.substring(index + 1);
            callback(line);
            index = remaining.indexOf('\n');
        }
    });

    input.on('end', function() {
        if (remaining.length > 0) {
            callback(remaining);
        }
    });
};

MyUtil.prototype.sleep = function(milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
};

MyUtil.prototype.stripLineBreaks = function(str) {
    if (str) {
        return str.replace(/(\r\n|\n|\r)/gm, '');
    }
    return str;
};

Date.prototype.format = function(style) {
    /// style:
    /// yyyy-MM-dd
    /// yyyy-MM-dd hh:mm:ss
    var options = {
        "M+": this.getMonth() + 1, // month 
        "d+": this.getDate(), // day 
        "h+": this.getHours(), // hour
        "m+": this.getMinutes(), // minute 
        "s+": this.getSeconds(), // second 
        "q+": Math.floor((this.getMonth() + 3) / 3), // quarter 
        "S": this.getMilliseconds() // millisecond 
    };
    if (/(y+)/.test(style)) {
        style = style.replace(RegExp.$1, this.getFullYear().toString().substr(4 - RegExp.$1.length));
    }
    for (var key in options) {
        if (new RegExp("(" + key + ")").test(style)) {
            style = style.replace(RegExp.$1, (RegExp.$1.length == 1) ?
                options[key] :
                ("00" + options[key]).substr(options[key].toString().length));
        }
    }
    return style;
}

if (!String.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/\{(\d+)\}/g, function(m, i) {
            return args[i];
        });
    };
}

module.exports = new MyUtil();