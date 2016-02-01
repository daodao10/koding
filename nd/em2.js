var fs = require('fs'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil'),
    em_quote = require('./EM_Quote');

function EM() {
    var downloadFA = function(code, reject, resolve) {
        try {
            var quote = new em_quote.Path({
                dataType: 'DC',
                reportType: 'SR',
                subReportType: 'YJBB',
                param: {
                    'code': '{1}'
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
                    return "代码,名称,每股收益,每股收益(扣除),营业收入(万元),同比增长,季度环比增长,净利润(万元),同比增长,季度环比增长,每股净资产,净资产收益率,每股经营现金流,销售毛利率,利润分配,股息率,公告日期,报告期,交易所";
                },
            });

            x.exec();
            if (resolve) resolve(1);
        } catch (err) {
            if (reject) {
                reject(err);
            } else {
                console.error(err);
            }
        }
    };
    var _getLastNYears = function(d, n) {
            var dates = [];
            var year = myUtil.toNumber(d.substring(0, 4)),
                month = myUtil.toNumber(d.substring(5, 7));

            if (month == 12) {
                for (var i = 0; i < n; i++) {
                    dates.push((year - i).toString() + '-12-31')
                }
            } else {
                for (var i = 1; i <= n; i++) {
                    dates.push((year - i).toString() + '-12-31')
                }
            }

            return dates;
        },
        _genRecord = function(cells) {
            return [cells[17], myUtil.toNumber(cells[2]), myUtil.toNumber(cells[10]), myUtil.toNumber(cells[11]), myUtil.toNumber(cells[12]), myUtil.toNumber(cells[13])];
        },
        _parseFA = function(code, reject, resolve) {
            var srcFile = './cn-fa/' + code + '.csv',
                dates = [
                    '2014-12-31',
                    '2013-12-31',
                    '2012-12-31',
                    '2011-12-31',
                    '2010-12-31'
                ];
            fs.readFile(srcFile, function(err, data) {
                if (err) {
                    reject(err);
                } else {
                    var lines = data.toString().split(/\r\n|\n/),
                        lastN = [],
                        ttm = [];

                    lines.forEach(function(line, index) {
                        if (index == 0) return;

                        var cells = line.split(',');
                        if (index == 1) {
                            dates = _getLastNYears(cells[17], 10);
                        }
                        if (dates.length == 0) return;

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

    return {
        getAnualReport: function() {

            var quote = new em_quote.Path({
                dataType: 'DC',
                reportType: 'SR',
                subReportType: 'YJYG',
                param: {
                    'fd': '{1}',
                    'stat': '0'
                },
                sort: {
                    id: "4",
                    desc: true
                },
                page: '{0}',
                pagesize: 100,
            });

            var x = new em_quote.Runner({
                host: 'datainterface.eastmoney.com',
                path: quote.path,
                urlParam: ['2015-12-31'],
                csvFile: 'es_yjyg.csv',
                header: function() {
                    return "代码,名称,业绩变动,业绩变动幅度,预告类型,上年同期净利润(万元),公告日期";
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
                pagesize: 50,
            });

            var x = new em_quote.Runner({
                host: 'nufm.dfcfw.com',
                path: quote.path,
                csvFile: 'es_ylyc.csv',
                header: function() {
                    return "序号,代码,名称,最新价,涨跌幅,研报数,买入,增持,中性,减持,卖出,2014收益,2015收益,2015PE,2016收益,2016PE,2017收益,2017PE,预留1,预留2,预留3";
                },
            });

            x.exec();
        },
        getEarnings: function(code) {
            downloadFA(code);
        },
        getEarningsBatch: function(action) {
            var func,
                symbolFile = './cn-test.csv';

            if (action == 'download') {
                func = downloadFA;
            } else if (action == 'parse') {
                func = _parseFA;
            } else {
                throw new Error('don\'t support');
            }

            var fx = function(newRows, index, total, counter) {
                if (index == total) {
                    console.log("------------- Saved %d -------------", counter);
                    return;
                };

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
                        counter += (x == undefined ? 0 : x);
                    });

                    fx(newRows, index + 1, total, counter);
                });
            };

            var settings = {
                    ChunkSize: 200
                },
                lines = myUtil.readlinesSync(symbolFile);

            lines.shift();
            lines = lines.chunk(settings.ChunkSize);

            fx(lines, 0, lines.length, 0);
        }
    }
};


var util = new EM();

util.getEarningsBatch('parse');
// util.getEarnings('600545');
// getEarnings('000635');

// util.getAnualReport();
// util.getEstimations();
