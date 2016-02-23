/**
 * 
 */

var fs = require('fs'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil'),
    em_quote = require('./EM_Quote');

function EM() {
    "use strict";

    var downloadFA = function(code, reject, resolve) {
        try {
            var quote = new em_quote.Path({
                dataType: 'DC',
                reportType: 'SR',
                subReportType: 'YJBB',
                param: {
                    code: '{1}'
                },
                sort: {
                    id: "14",
                    desc: true
                },
                page: '{0}',
                pagesize: 50
            });

            var x = new em_quote.Runner({
                host: 'datainterface.eastmoney.com',
                path: quote.path,
                urlParam: [code],
                csvFile: './cn-fa/' + code + '.csv',
                header: function() {
                    return unescape("\u4ee3\u7801,\u540d\u79f0,\u6bcf\u80a1\u6536\u76ca,\u6bcf\u80a1\u6536\u76ca(\u6263\u9664),\u8425\u4e1a\u6536\u5165(\u4e07\u5143),\u540c\u6bd4\u589e\u957f,\u5b63\u5ea6\u73af\u6bd4\u589e\u957f,\u51c0\u5229\u6da6(\u4e07\u5143),\u540c\u6bd4\u589e\u957f,\u5b63\u5ea6\u73af\u6bd4\u589e\u957f,\u6bcf\u80a1\u51c0\u8d44\u4ea7,\u51c0\u8d44\u4ea7\u6536\u76ca\u7387,\u6bcf\u80a1\u7ecf\u8425\u73b0\u91d1\u6d41,\u9500\u552e\u6bdb\u5229\u7387,\u5229\u6da6\u5206\u914d,\u80a1\u606f\u7387,\u516c\u544a\u65e5\u671f,\u62a5\u544a\u671f,\u4ea4\u6613\u6240");
                }
            });

            x.exec();
            if (resolve) {
                resolve(1);
            }
        } catch (err) {
            if (reject) {
                reject(err);
            } else {
                console.error(err);
            }
        }
    };
    var _getLastNYears = function(d, n) {
            if (d == undefined) {
                return;
            }
            var i, dates = [];
            var year = myUtil.toNumber(d.substring(0, 4)),
                month = myUtil.toNumber(d.substring(5, 7));

            if (month == 12) {
                for (i = 0; i < n; i++) {
                    dates.push((year - i).toString() + '-12-31');
                }
            } else {
                for (i = 1; i <= n; i++) {
                    dates.push((year - i).toString() + '-12-31');
                }
            }

            return dates;
        },
        _genRecord = function(cells) {
            return [cells[17], myUtil.toNumber(cells[2]), myUtil.toNumber(cells[10]), myUtil.toNumber(cells[11]), myUtil.toNumber(cells[12]), myUtil.toNumber(cells[13])];
        },
        _parseFA = function(code, reject, resolve) {
            var srcFile = './cn-fa/' + code + '.csv',
                dates;
            fs.readFile(srcFile, function(err, data) {
                if (err) {
                    reject(err);
                } else {
                    var lines = data.toString().split(/\r\n|\n/),
                        lastN = [],
                        ttm = [];

                    lines.forEach(function(line, index) {
                        if (index === 0) {
                            return;
                        }

                        var cells = line.split(',');
                        if (index === 1) {
                            dates = _getLastNYears(cells[17], 10);
                        }
                        if (dates === undefined) {
                            console.log('please check the file %s', srcFile);
                            return;
                        }
                        if (dates.length === 0) {
                            return;
                        }

                        // get for ttm
                        if (index < 5) {
                            ttm.push(_genRecord(cells));
                        }
                        // get for last n years
                        if (cells[17] == dates[0]) {
                            lastN.push(_genRecord(cells));
                            dates.shift();
                        }
                    });

                    fs.writeFile(srcFile.replace('.csv', '.json'), JSON.stringify({
                        lastn: lastN,
                        ttm: ttm
                    }), function(err) {
                        if (err) {
                            reject(err);
                        }
                        resolve(1);
                        console.log('saved.');
                    });

                }
            });
        };

    function round(value, decimals) {
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    }

    function calcPEG(e1, e2, pe) {
        var growth, peg = 0;
        if (e1 == Number.NaN || e1 == 0) {
            growth = Number.NaN;
        } else {
            growth = (Math.sqrt(e2 / e1) - 1) * 100;
            if (growth == 0) {
                peg = Number.NaN;
            } else {
                peg = round(pe / growth, 2);
                growth = round(growth, 2);
            }
        }
        return [growth, peg];
    }

    return {
        getAnualReport: function() {

            var quote = new em_quote.Path({
                dataType: 'DC',
                reportType: 'SR',
                subReportType: 'YJYG',
                param: {
                    fd: '{1}',
                    stat: '0'
                },
                sort: {
                    id: "4",
                    desc: true
                },
                page: '{0}',
                pagesize: 100
            });

            var x = new em_quote.Runner({
                host: 'datainterface.eastmoney.com',
                path: quote.path,
                urlParam: ['2015-12-31'],
                csvFile: 'es_yjyg.csv',
                header: function() {
                    return unescape("\u4ee3\u7801,\u540d\u79f0,\u4e1a\u7ee9\u53d8\u52a8,\u4e1a\u7ee9\u53d8\u52a8\u5e45\u5ea6,\u9884\u544a\u7c7b\u578b,\u4e0a\u5e74\u540c\u671f\u51c0\u5229\u6da6(\u4e07\u5143),\u516c\u544a\u65e5\u671f");
                },
                refine: function(line) {
                    var cells = line.split(',');
                    if (cells.length === 9) {
                        return "{0},{1},\"{2}\",{3},{4},{5},{6}".format(cells[0], cells[1], cells[2].replace(/&sbquo/g, ','), cells[3], cells[4], cells[5], cells[7]);
                    }
                }
            });

            x.exec();
        },
        getEstimations: function() {

            var quote = new em_quote.Path({
                dataType: 'FA',
                reportType: 'CT',
                subReportType: 'GEMCPF',
                param: {
                    cmd: 'C._A',
                    cb: '',
                    token: '3a965a43f705cf1d9ad7e1a3e429d622',
                    rt: '48474285'
                },
                sort: {
                    id: "(Code)",
                    desc: false
                },
                page: '{0}',
                pagesize: 50
            });

            var x = new em_quote.Runner({
                host: 'nufm.dfcfw.com',
                path: quote.path,
                csvFile: 'es_ylyc.csv',
                header: function() {
                    return unescape("\u5e8f\u53f7,\u4ee3\u7801,\u540d\u79f0,\u6700\u65b0\u4ef7,\u6da8\u8dcc\u5e45,\u7814\u62a5\u6570,\u4e70\u5165,\u589e\u6301,\u4e2d\u6027,\u51cf\u6301,\u5356\u51fa,2014\u6536\u76ca,2015\u6536\u76ca,2015PE,2016\u6536\u76ca,2016PE,2017\u6536\u76ca,2017PE,\u9884\u75591,\u9884\u75592,\u9884\u75593");
                }
            });

            x.exec();
        },
        getEarnings: function(code) {
            downloadFA(code);
        },
        getEarningsBatch: function(action) {
            var func,
                symbolFile = './cn-test.csv';

            if (action === 'download') {
                func = downloadFA;
            } else if (action === 'parse') {
                func = _parseFA;
            } else {
                throw new Error('don\'t support');
            }

            var settings = {
                    ChunkSize: 200
                },
                lines = myUtil.readlinesSync(symbolFile);

            lines.shift();
            lines = lines.chunk(settings.ChunkSize);

            (function fx(newRows, index, total, counter) {
                if (index == total) {
                    console.log("------------- processed %d -------------", counter);
                    return;
                }

                Promise.all(newRows[index].map(function(item) {
                    return new Promise(function(resolve, reject) {
                        if (item) {
                            var cells = item.split(',');
                            // console.log(cells[1]);

                            func(cells[1], reject, resolve);

                        } else {
                            reject('empty');
                        }
                    }).catch(function(e) {
                        console.error(e);
                    });
                })).then(function(val) {
                    val.forEach(function(x) {
                        counter += (x === undefined ? 0 : x);
                    });

                    fx(newRows, index + 1, total, counter);
                });
            }(lines, 0, lines.length, 0));

        },
        gen: function() {
            // 序号,代码,名称,最新价,涨跌幅,研报数,买入,增持,中性,减持,卖出,2014收益,2015收益,2015PE,2016收益,2016PE,2017收益,2017PE
            // 0  ,1   ,2  ,3    ,4     ,5    ,6  ,7   ,8  ,9   ,10 ,11      ,12     ,13    ,14     ,15    ,16      ,17
            var docs = {},
                rs = {};
            var lines = myUtil.readlinesSync('./es_ylyc.csv');
            for (var i = 1; i < lines.length; i++) {
                var cells = lines[i].split(',');
                if (cells.length > 1) {

                    var item = [];
                    var p = calcPEG(cells[11], cells[14], cells[13]);
                    item.push(['2015', p[0], p[1]]);

                    p = calcPEG(cells[12], cells[16], cells[15]);
                    item.push(['2016', p[0], p[1]]);

                    docs[cells[1]] = item;

                    rs[cells[1]] = [myUtil.toNumber(cells[5]),
                        myUtil.toNumber(cells[6]),
                        myUtil.toNumber(cells[7]),
                        myUtil.toNumber(cells[8]),
                        myUtil.toNumber(cells[9]),
                        myUtil.toNumber(cells[10]),
                        myUtil.toNumber(cells[11]),
                        myUtil.toNumber(cells[12]),
                        myUtil.toNumber(cells[13]),
                        myUtil.toNumber(cells[14]),
                        myUtil.toNumber(cells[15]),
                        myUtil.toNumber(cells[16]),
                        myUtil.toNumber(cells[17])
                    ];
                }
            }

            fs.writeFile('peg.json', JSON.stringify(docs, null, 1), function(err) {
                if (err) {
                    throw err;
                }
                console.log('saved.');
            });
            fs.writeFile('e.json', JSON.stringify(rs, null, 1), function(err) {
                if (err) {
                    throw err;
                }
                console.log('saved.');
            });
        }
    };
}


var util = new EM();
util.gen();

// util.getEarningsBatch('parse');
// util.getEarnings('600832');

// util.getAnualReport();
// util.getEstimations();