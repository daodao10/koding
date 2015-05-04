const EtlSettingsFile = './val500_etl.json';

var fs = require('fs'),
    Promise = require('promise'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil'),
    MyMongo = require('./MyMongoUtil'),
    config = require('../config.json'),
    EtlSettings = require(EtlSettingsFile);

var myMongo = new MyMongo("{0}{1}".format(config.DbSettings.QuotesDbUri, 'quotes'));

function main(key) {

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
            return {
                "_id": myUtil.getLastDateOfMonth(element[1], element[2]),
                "c": myUtil.toNumber(element[3])
            };
        },

        CPI: function(element) {
            return rowDataProcessor.BDI(element);
        },

        PPI: function(element) {
            return rowDataProcessor.BDI(element);
        },

        USDX_m: function(element) {
            return rowDataProcessor.BDI(element);
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
            if (element[1]) {
                return [Number(element[1]), new Date(Number(element[2]), Number(element[3]) - 1, Number(element[4])).getTime()];
            } else {
                return [Number(element[5]), element[6]];
            }
        }

    };
    var nextProcessor = {
        PE: function(elements) {
            var start,
                arrType = 0,
                x = [],
                y1 = [],
                y2 = [],
                y3 = [];
            elements.forEach(function(element, index) {
                if (index === 0) {
                    start = element[0];
                } else if (element[0] == start) {
                    arrType++;
                }

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

            elements.sort(function(a, b) {
                if (a._id > b._id) return 1;
                else if (a._id < b._id) return -1;
                return 0;
            });
        },

        USDX: function(elements) {
            var start,
                arrType = 0,
                x = [],
                y1 = [];
            elements.forEach(function(element, index) {
                if (index === 0) {
                    start = element[0];
                } else if (element[0] == start) {
                    arrType++;
                }

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

            // order by _id desc
            elements.sort(function(a, b) {
                if (a._id < b._id) return 1;
                else if (a._id > b._id) return -1;
                return 0;
            });

            // print
            elements.forEach(function(element) {
                console.log("{0},,,,,,{1}".format(new Date(element._id).format('yyyy-MM-dd'), element.c));
            });
        }
    };

    var settings = EtlSettings[key];

    get(settings.path).then(function(content) {
        // save(key, content);

        var docs = parse(new RegExp(settings.regex, 'gi'), content, rowDataProcessor[key]);
        if (docs[0]) {

            if (settings.next) {
                nextProcessor[key](docs);
            }

            // console.dir(docs);

            if (settings.first) {
                myMongo.insert(settings.collection, docs, function(err, docs) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                });
            } else {
                myMongo.upsertBatch(settings.collection, docs, function(err, result) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    console.dir(result);
                });
            }
        } else {
            console.log('empty');
        }
    }, function(error) {
        console.error('get url[%s] failed, error: %s', error.url, error.error);
    }).catch(function(error) {
        console.error(error);
    });

    function get(url) {
        return new Promise(function(resolve, reject) {
            myUtil.get({
                host: 'value500.com',
                path: url
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

    function parse(reg, input, dataFunc) {
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

    function save(name, content) {
        fs.writeFile(name + ".txt", content, function(err) {
            if (err) {
                throw err;
            }
            console.log('done');
        });
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