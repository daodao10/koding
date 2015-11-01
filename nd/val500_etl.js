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

        BDI: function(element) {
            if (element[1]) {
                return [Number(element[1]), new Date(Number(element[2]), Number(element[3]) - 1, Number(element[4])).getTime()];
            } else {
                return [Number(element[5]), element[6]];
            }
        },

        CPI: function(element) {
            return {
                "_id": myUtil.getLastDateOfMonth(element[1], element[2]),
                "c": myUtil.toNumber(element[3])
            };
        },

        PPI: function(element) {
            return rowDataProcessor.CPI(element);
        },

        USDX_m: function(element) {
            return rowDataProcessor.CPI(element);
        },

        GDP: function(element) {
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

        PMI: function(element) {
            return {
                "_id": myUtil.getLastDateOfMonth(element[1], element[2]),
                "c": myUtil.toNumber(element[3]),
                "hsbc": myUtil.toNumber(element[4])
            };
        },

        PE: function(element) {
            if (element[1]) {
                return [Number(element[1]), myUtil.getLastDateOfMonth(element[2], element[3])];
            } else {
                return [Number(element[4]), element[5]];
            }
        },

        USDX: function(element) {
            return rowDataProcessor.BDI(element);
        }

    },
    nextProcessor = {
        BDI: function(elements) {
            var start = 0,
                arrType = 0,
                x = [],
                y1 = [];
            elements.forEach(function(element, index) {
                // xid decreased
                if (element[0] >= start && index !== 0) {
                    arrType++;
                }
                start = element[0];

                if (arrType === 0) {
                    x["_" + element[0]] = element[1];
                } else if (arrType === 1) {
                    y1["_" + element[0]] = element[1];
                }
            });

            elements.clear();
            Object.keys(x).forEach(function(p, idx, array) {
                if (y1[p] != undefined) {
                    elements.push({
                        "_id": x[p],
                        "c": myUtil.toNumber(y1[p])
                    });
                }
            });

            // order by _id asc
            elements.sort(function(a, b) {
                if (a._id < b._id) return -1;
                else if (a._id > b._id) return 1;
                return 0;
            });
        },

        PE: function(elements) {
            var start = 0,
                arrType = 0,
                x = [],
                y1 = [],
                y2 = [],
                y3 = [];
            elements.forEach(function(element, index) {
                // xid increased
                if (element[0] <= start && index !== 0) {
                    arrType++;
                }
                start = element[0];


                if (arrType === 0) {
                    x["_" + element[0]] = element[1];
                } else if (arrType === 1) {
                    y1["_" + element[0]] = element[1];
                } else if (arrType === 2) {
                    y2["_" + element[0]] = element[1];
                } else if (arrType === 3) {
                    y3["_" + element[0]] = element[1];
                }
            });

            elements.clear();
            Object.keys(x).forEach(function(p, idx, array) {

                if (!(y1[p] == undefined && y2[p] == undefined && y3[p] == undefined)) {
                    elements.push({
                        "_id": x[p],
                        "sh": myUtil.toNumber(y1[p]),
                        "sz": myUtil.toNumber(y2[p]),
                        "hk": myUtil.toNumber(y3[p])
                    });
                }
            });

            // order by _id asc
            elements.sort(function(a, b) {
                if (a._id > b._id) return -1;
                else if (a._id < b._id) return 1;
                return 0;
            });
        },

        USDX: function(elements) {

            nextProcessor.BDI(elements);

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

    _get(settings.path).then(function(content) {
            // _save(key, content);

            if (settings.chartnth && settings.chartnth > 0) {
                var nth = settings.chartnth;
                _parse(/<chart><series>(.+)<\/graphs><\/chart>/g, content, function(elements) {
                    if (--nth == 0) {
                        content = elements[1];
                    }
                });
            }

            var docs = _parse(new RegExp(settings.regex, 'gi'), content, rowDataProcessor[key]);
            if (docs[0]) {

                if (settings.next) {
                    nextProcessor[key](docs);
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
        },
        function(error) {
            console.error('get url[%s] failed, error: %s', error.url, error.error);
        }).catch(function(error) {
        console.error(error);
    });

    function _get(url) {
        return new Promise(function(resolve, reject) {
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

// main('USDX');
// main('PE');
// main('PPI');
// main('CPI');
// main('PMI');
// main('BDI');
// main('GDP');
Object.getOwnPropertyNames(EtlSettings).forEach(function(key, idx, array) {
    main(key);
});
