var http = require('http'),
    fs = require('fs');

var MyUtil = function() {};

MyUtil.prototype.extend = function(origin, add) {
    // don't do anything if add isn't an object
    if (!add || typeof add !== 'object') return origin;

    var keys = Object.keys(add);
    var i = keys.length;
    while (i--) {
        origin[keys[i]] = add[keys[i]];
    }
    return origin;
};

MyUtil.prototype.get = function(options, callback) {
    options = this.extend({
        port: 80,
        method: 'GET',
        headers: {
            'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.6,en;q=0.4,zh-TW;q=0.2',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36',
        }
        // , debug: true
    }, options);
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

MyUtil.prototype.readlinesSync = function(filePath, options) {
    options = this.extend({
        encoding: 'utf-8'
    }, options);
    var content = fs.readFileSync(filePath, options);
    if (content) {
        return content.toString().split('\n');
    }
};

MyUtil.prototype.sleep = function(milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
};

MyUtil.prototype.log2 = function(x) {
    if (x <= 0) return NaN;
    return Math.log(x) / Math.LN2;
};

module.exports = new MyUtil();
