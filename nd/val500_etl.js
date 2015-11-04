const EtlSettingsFile = './val500_etl.json';

var fs = require('fs'),
    //Promise = require('promise'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil'),
    MyMongo = require('./MyMongoUtil'),
    config = require('../config.json'),
    EtlSettings = require(EtlSettingsFile);

var myMongo = new MyMongo("{0}{1}".format(config.DbSettings.QuotesDbUri, 'quotes'));
var tableProcessor = {
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
        _YearMonth: function(element, options) {
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
            return tableProcessor._YearMonth(element, {
                cols: ["c"]
            });
        },
        PPI: function(element) {
            return tableProcessor._YearMonth(element, {
                cols: ["c"]
            });
        },
        PMI: function(element) {
            return tableProcessor._YearMonth(element, {
                cols: ["c", "hsbc"]
            });
        },

        USDX_m: function(element) {
            return tableProcessor._YearMonth(element, {
                cols: ["c"]
            });
        },

        GDP: function(element) {
            var index = element[1].indexOf("年");
            if (index > 0) {
                return {
                    "_id": tableProcessor._quarter2Date(element[1].substring(0, index), element[1].substr(index + 1)),
                    "c": myUtil.toNumber(element[2]),
                    "r": myUtil.toNumber(element[3])
                };
            }
            return null;
        },

        MV: function(element) {
            return tableProcessor._YearMonth(element, {
                cols: ["tmc", "cmc"]
            });
        },

        MV_GDP: function(element) {
            var index = element[1].indexOf("年");
            if (index > 0) {
                return {
                    "_id": tableProcessor._quarter2Date(element[1].substring(0, index), element[1].substr(index + 1)),
                    "gdp": myUtil.toNumber(element[2])
                };
            }
            return null;
        },

        KQI3: function(element) {
            return tableProcessor._YearMonth(element, {
                "cols": ["rail", "loan", "power"]
            });
        }
    },
    chartProcessor = {
        _core: function(xy, options) {
            var result = [],
                yn = [],
                cols = options.cols;

            xy.yn.forEach(function(yi, index) {
                yi.forEach(function(y) {
                    if (yn[index] == undefined) yn[index] = {};
                    yn[index][y[0]] = y[1];
                });
            });

            xy.x.forEach(function(x) {
                if (x != undefined) {
                    var tmp = {
                        "_id": x[1]
                    };
                    for (var i = 0; i < cols.length; i++) {
                        if (yn[i][x[0]] !== undefined)
                            tmp[cols[i]] = myUtil.toNumber(yn[i][x[0]]);
                    }
                    result.push(tmp);
                }
            });

            // order by _id asc
            result.sort(function(a, b) {
                if (a._id < b._id) return -1;
                else if (a._id > b._id) return 1;
                return 0;
            });

            return result;
        },

        BDI: function(elements, options) {
            return chartProcessor._core(elements, options);
        },

        PE: function(elements, options) {
            return chartProcessor._core(elements, options);
        },

        PE_HSI: function(elements, options) {
            return chartProcessor._core(elements, options);
        },

        KQI: function(elements, options) {
            return chartProcessor._core(elements, options);
        },

        USDX: function(elements, options) {
            var result = chartProcessor._core(elements, options);

            // additional, print out the data for last 30 days
            var tmpArr = result.slice(-30);
            tmpArr.forEach(function(element) {
                console.log("{0},,,,,,{1}".format(new Date(element._id).format('yyyy-MM-dd'), element.c));
            });

            return result;
        },

        BOND: function(elements, options) {
            return chartProcessor._core(elements, options);
        }
    },
    serieProcessor = {
        yearMonthPattern: "<value xid='(\\d+)'>(\\d{4})年(\\d+)月<\/value>",
        yearMonthDayPattern: "<value xid='(\\d+)'>(\\d{4})年(\\d+)月(\\d+)日<\/value>",
        yearMonth: function(element) {
            return ["_" + element[1], myUtil.getLastDateOfMonth(element[2], element[3])];
        },
        yearMonthDay: function(element) {
            return ["_" + element[1], new Date(Number(element[2]), Number(element[3]) - 1, Number(element[4])).getTime()];
        }
    },
    graphProcessor = {
        numberPattern: "<value xid='(\\d+)'>([-0-9.]+)<\/value>",
        parseNumber: function(element) {
            return ["_" + element[1], element[2]];
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

            if (settings.chart) {
                var chartElements = content.toString().match(new RegExp(_chartPaser.chartPattern, "gi"));

                if (chartElements) {
                    settings.chart.forEach(function(chartOptions) {
                        var chartContent = chartElements[chartOptions.nth];

                        var x = _chartPaser["parse" + chartOptions.parser](chartContent);
                        var y = _chartPaser.parseNumber(chartContent);

                        var xy = {
                            "x": x ? x[0] : null,
                            "yn": y
                        };

                        // console.dir(xy.x);
                        // console.log("--------------");
                        // console.dir(xy.yn);

                        _store(key, chartProcessor[key](xy, chartOptions));

                    });
                } else {
                    console.error("failed to parse chart");
                }
            } else {
                var docs = _parse(new RegExp(settings.regex, 'gi'), content, tableProcessor[key]);
                _store(key, docs);
            }
        },
        function(error) {
            console.error('get url[%s] failed, error: %s', error.url, error.error);
        }).catch(function(error) {
        console.error(error);
    });


    function _store(key, docs) {
        if (docs[0]) {
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
            console.log("document", key, 'is empty');
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

    var _chartPaser = {
        chartPattern: "<chart>(.+)<\/chart>",
        _dateParse: function(chartContent, pattern, processor) {
            return _parse(/<series>(.+?)<\/series>/g, chartContent, function(serieElement) {
                return _parse(new RegExp(pattern, "g"), serieElement[1], processor);
            });
        },
        parseYearMonth: function(chartContent) {
            return _chartPaser._dateParse(chartContent, serieProcessor.yearMonthPattern, serieProcessor.yearMonth);
        },
        parseYearMonthDay: function(chartContent) {
            return _chartPaser._dateParse(chartContent, serieProcessor.yearMonthDayPattern, serieProcessor.yearMonthDay);
        },
        parseNumber: function(chartContent) {
            return _parse(/<graph\s.+?>(.+?)<\/graph>/g, chartContent, function(graphElement) {
                return _parse(new RegExp(graphProcessor.numberPattern, "g"), graphElement[1], graphProcessor.parseNumber);
            });
        }
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

// main('MV');
// main('MV_GDP');
// main('PE_HSI');
// main('BOND');
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