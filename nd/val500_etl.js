const EtlSettingsFile = './val500_etl.json';

var fs = require('fs'),
    //Promise = require('promise'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil'),
    MyMongo = require('./MyMongoUtil'),
    config = require('../config.json'),
    EtlSettings = require(EtlSettingsFile);

var myMongo = new MyMongo("{0}{1}".format(config.DbSettings.QuotesDbUri, 'quotes'));
var rowDataProcessor = {
        _quarter2Date: function(year, str) {
            if (str == "一季度") {
                return myUtil.getLastDateOfMonth(year, 3);
            } else if (str == "一至二季度") {
                return myUtil.getLastDateOfMonth(year, 6);
            } else if (str == "一至三季度") {
                return myUtil.getLastDateOfMonth(year, 9);
            } else {
                return myUtil.getLastDateOfMonth(year, 12);
            }
        },
        _chartYearMonth: function(element, options) {
            if (element[1]) {
                return [Number(element[1]), myUtil.getLastDateOfMonth(element[2], element[3])];
            } else {
                return [Number(element[4]), element[5]];
            }
        },
        _chartYearMonthDay: function(element, options) {
            if (element[1]) {
                return [Number(element[1]), new Date(Number(element[2]), Number(element[3]) - 1, Number(element[4])).getTime()];
            } else {
                return [Number(element[5]), element[6]];
            }
        },
        _tableYearMonth: function(element, options) {
            var cols = options.cols,
                tmp = {
                    "_id": myUtil.getLastDateOfMonth(element[1], element[2])
                };
            for (var i = 0; i < cols.length; i++) {
                tmp[cols[i]] = myUtil.toNumber(element[3 + i]);
            }

            return tmp;
        },

        CPI: function(element) {
            return rowDataProcessor._tableYearMonth(element, {
                cols: ["c"]
            });
        },

        PPI: function(element) {
            return rowDataProcessor._tableYearMonth(element, {
                cols: ["c"]
            });
        },

        USDX_m: function(element) {
            return rowDataProcessor._tableYearMonth(element, {
                cols: ["c"]
            });
        },

        GDP: function(element, options) {
            var index = element[1].indexOf("年");
            if (index > 0) {
                return {
                    "_id": rowDataProcessor._quarter2Date(element[1].substring(0, index), element[1].substr(index + 1)),
                    "c": myUtil.toNumber(element[2]),
                    "r": myUtil.toNumber(element[3])
                };
            }
            return null;
        },

        PMI: function(element, options) {
            return rowDataProcessor._tableYearMonth(element, {
                cols: ["c", "hsbc"]
            });
        },

        KQI3: function(element) {
            return rowDataProcessor._tableYearMonth(element, {
                "cols": ["rail", "loan", "power"]
            });
        },

        BDI: function(element) {
            return rowDataProcessor._chartYearMonthDay(element);
        },

        KQI: function(element) {
            return rowDataProcessor._chartYearMonth(element);
        },

        PE: function(element) {
            return rowDataProcessor._chartYearMonth(element);
        },

        USDX: function(element) {
            return rowDataProcessor._chartYearMonthDay(element);
        }
    },
    nextProcessor = {
        _chartProcessor: function(elements, options) {
            var start = 0,
                arrType = 0,
                x = [],
                yn = [],
                cols = options.cols;
            elements.forEach(function(element, index) {
                if (options.xid == -1) { // xid decreased
                    if (element[0] >= start && index !== 0) arrType++;
                } else if (options.xid == 1) { // xid increased
                    if (element[0] <= start && index !== 0) arrType++;
                }

                start = element[0];

                if (arrType === 0) {
                    x["_" + element[0]] = element[1];
                } else {
                    if (yn[arrType - 1] == undefined) yn[arrType - 1] = [];
                    yn[arrType - 1]["_" + element[0]] = element[1];
                }
            });

            elements.clear();
            Object.keys(x).forEach(function(p, idx, array) {
                if (x[p] != undefined) {
                    var tmp = {
                        "_id": x[p]
                    };
                    for (var i = 0; i < cols.length; i++) {
                        if (yn[i][p] !== undefined)
                            tmp[cols[i]] = myUtil.toNumber(yn[i][p]);
                    }
                    elements.push(tmp);
                }
            });

            // order by _id asc
            elements.sort(function(a, b) {
                if (a._id < b._id) return -1;
                else if (a._id > b._id) return 1;
                return 0;
            });
        },

        BDI: function(elements, options) {
            nextProcessor._chartProcessor(elements, options);
        },

        PE: function(elements, options) {
            nextProcessor._chartProcessor(elements, options);
        },

        KQI: function(elements, options) {
            nextProcessor._chartProcessor(elements, options);
        },

        USDX: function(elements, options) {

            nextProcessor._chartProcessor(elements, options);

            // additional, print out the data for last 30 days
            var tmpArr = elements.slice(-30);
            tmpArr.forEach(function(element) {
                console.log("{0},,,,,,{1}".format(new Date(element._id).format('yyyy-MM-dd'), element.c));
            });
        }
    };

function main(key) {
    console.log('%s is processing...', key);
    var settings = EtlSettings[key];
    if (!settings) {
        console.log("settings of %s cannot find", key);
        return;
    }

    _get(settings.path, settings.file).then(function(content) {
            // _save(key, content);

            var regex = new RegExp(settings.regex, 'gi');

            if (settings.chart) {
                settings.chart.forEach(function(chart) {
                    var nth = chart.nth;
                    _parse(/<chart><series>(.+)<\/graphs><\/chart>/g, content, function(elements) {
                        if (--nth == 0) {
                            _x(key, regex, elements[1], chart);
                        }
                    });
                });
            } else {
                _x(key, regex, content);
            }
        },
        function(error) {
            console.error('get url[%s] failed, error: %s', error.url, error.error);
        }).catch(function(error) {
        console.error(error);
    });


    function _x(key, regex, content, options) {
        var docs = _parse(regex, content, rowDataProcessor[key]);
        if (docs[0]) {

            if (settings.next) {
                nextProcessor[key](docs, options);
            }

            // console.dir(docs);

            if (settings.first) {
                myMongo.insert(settings.collection, docs, function(err, docs) {
                    _logResult(key, err, result);
                });
            } else {
                myMongo.upsertBatch(settings.collection, docs, function(err, result) {
                    _logResult(key, err, result);
                });
            }
        } else {
            console.log(key, 'empty');
        }
    }

    function _get(url, fileSystem) {
        // enable load content from url or file system

        return new Promise(function(resolve, reject) {
            if (fileSystem) {
                fs.readFile(url, function(err, data) {
                    if (err) {
                        reject({
                            url: url,
                            error: err
                        });
                    }

                    resolve(data);
                });
            } else {
                myUtil.get({
                    host: 'value500.com',
                    path: url,
                    "Upgrade-Insecure-Requests": 1
                }, function(data, statusCode) {

                    if (statusCode !== 200) {
                        console.error('error occurred: ', statusCode);
                        reject({
                            url: url,
                            error: statusCode
                        });
                    }

                    resolve(data);
                });
            }
        });
    }

    function _parse(reg, input, dataFunc) {
        var result = [],
            m;
        while ((m = reg.exec(input))) {
            if (m.index === m.lastIndex) {
                m.lastIndex++;
            }
            result.push(dataFunc(m));
        }
        return result;
    }

    function _save(name, content) {
        fs.writeFile(name + ".txt", content, function(err) {
            if (err) {
                throw err;
            }
            console.log('done');
        });
    }

    function _logResult(key, err, result) {
        if (err) {
            console.error(err);
        } else {
            console.log('%s done', key);
            console.dir(result);
        }
    }

}

// main('KQI3');
// main('KQI');
// main('USDX');
// main('USDX_m');
// main('PE');
// main('PPI');
// main('CPI');
// main('PMI');
// main('BDI');
// main('GDP');
Object.getOwnPropertyNames(EtlSettings).forEach(function(key, idx, array) {
    main(key);
});
