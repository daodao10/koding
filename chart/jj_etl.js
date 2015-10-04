var fs = require('fs'),
    //Promise = require('promise'),
    anounymous = require('../nd/ProtoUtil'),
    myUtil = require('../nd/MyUtil');

function QuoteEtl() {
    console.log('QuoteEtl is called');
}
QuoteEtl.extend = function(Child, settings) {
    console.log('call extend');
    var F = function() {};　　　　
    F.prototype = QuoteEtl.prototype;　　　　
    Child.prototype = new F();　　　　
    Child.prototype.constructor = Child;
    Child.prototype.settings = settings;
};

var get = function(pathArgs) {
        var self = this;
        // console.log(self.settings.PathFormat.format(pathArgs.s, pathArgs.i));
        return new Promise(function(resolve, reject) {
            myUtil.get({
                host: self.settings.Host,
                path: self.settings.PathFormat.format(pathArgs.s, pathArgs.i)
            }, function(data, statusCode) {

                if (statusCode !== 200) {
                    console.error('error occurred: ', statusCode);
                    reject(statusCode);
                    return;
                }

                resolve(self.getResolve(pathArgs, data));
            });
        });
    },
    write = function(filename, content) {
        fs.writeFileSync(filename, content, {
            'encoding': 'utf-8'
        });
    },
    writeAdapter = function(result, func) {
        if (result && result.data && result.data.length > 0) {
            func.call(this, result)
        } else {
            console.error(result && result.symbol ? result.symbol : "result", "is empty");
        }
    };

QuoteEtl.prototype = {
    settings: {},
    parsePlain: function(pathArgs, totalPages) {
        var pathArgsArray = [];
        for (var i = 1; i <= totalPages; i++) {
            pathArgsArray.push({
                s: pathArgs.s,
                i: i
            });
        }
        return pathArgsArray;
    },
    parseData: function(pathArgs, content) {
        var result = [],
            m;
        while ((m = this.settings.DataReg.exec(content))) {
            if (m.index === m.lastIndex) {
                m.lastIndex++;
            }
            result.push([m[1].replace(/-/g, ''), Number(m[2])]);
        }
        return result;
    },
    getResolve: function(pathArgs, data) {
        var self = this;
        if (pathArgs.plain) {
            return self.parsePlain(pathArgs, data);
        } else {
            return self.parseData(pathArgs, data);
        }
    },
    wrapPathArgs: function(symbol) {
        return {
            s: symbol,
            i: 1,
            plain: true
        };
    },
    read: function(symbol) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var pathArgs = self.wrapPathArgs(symbol);

            get.call(self, pathArgs).then(function(pathArgsArray) {
                Promise.all(pathArgsArray.map(function(element) {
                        return get.call(self, element);
                    }))
                    .then(function(data) {
                        var x = [];
                        data.forEach(function(element) {
                            x = x.concat(element);
                        });

                        resolve({
                            symbol: symbol,
                            data: x
                        });

                    }).catch(function(statusCode) {
                        console.log("inner error:", statusCode);
                        reject(statusCode);
                    });

            }).catch(function(statusCode) {
                console.log("outer error:", statusCode);
                reject(statusCode);
            });
        });
    },
    write_csv: function(result) {
        writeAdapter.call(this, result, function(d) {
            var content = 'Date,Close\n' + d.data.join("\n"),
                filename = d.symbol + '.csv';
            write(filename, content);
        });
    },
    write_js: function(result) {
        writeAdapter.call(this, result, function(d) {
            d.data.reverse();
            var content = 'var data=' + JSON.stringify(d.data) + ";\
                var source='" + this.settings.Host + "';",
                filename = this.settings.DestFolder + d.symbol + '_d.js';
            write(filename, content);
        });
    }
};


module.exports = QuoteEtl;
