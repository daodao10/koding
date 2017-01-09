/**
 * 
 */

var fs = require('fs'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil'),
    em_quote = require('./EM_Quote');

function EM() {
    "use strict";

    var wrapRequireJs = function (content) {
        return "define(function() {\n\
    return {0};\n\
});".format(content);
    };

    var
        _downloadFA = function (code, reject, resolve) {
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
                    csvFile: './cn-fa-hid/' + code + '.csv',
                    header: function () {
                        return unescape("代码,名称,每股收益,每股收益(扣除),营业收入(万元),同比增长,季度环比增长,净利润(万元),同比增长,季度环比增长,每股净资产,净资产收益率,每股经营现金流,销售毛利率,利润分配,股息率,公告日期,报告期,交易所");
                    }
                });

                x.exec(null, reject, resolve);

            } catch (err) {
                if (reject) {
                    reject(err);
                } else {
                    console.error('@downloadFA', err);
                }
            }
        },
        _parseFA = function (code, reject, resolve) {
            var _genRecord = function (cells) {
                return [cells[17], myUtil.toNumber(cells[2]), myUtil.toNumber(cells[10]), myUtil.toNumber(cells[11]), myUtil.toNumber(cells[12]), myUtil.toNumber(cells[13])];
            };

            var srcFile = './cn-fa-hid/' + code + '.csv',
                dates;

            fs.readFile(srcFile, function (err, data) {
                if (err) {
                    if (reject) reject(err);
                    else console.error('@parseFA', err);
                } else {
                    var lines = data.toString().split(/\r\n|\n/),
                        lastN = [],
                        ttm = [];

                    lines.forEach(function (line, index) {
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
                    }), function (err) {
                        if (err) {
                            if (reject) reject(err);
                            else console.error('@writeFile', err);
                        }
                        if (resolve) resolve(1);
                        console.log('saved.');
                    });

                }
            });
        },
        _getLastNYears = function (d, n) {
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
        };

    function round(value, decimals) {
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    }

    function calcPEG(e1, e2, e3, p) {
        var growth = Number.NaN, peg = Number.NaN, target = Number.NaN;
        if (e1 == Number.NaN || e1 == 0) {
            growth = Number.NaN;
        } else {
            growth = (Math.sqrt(e3 / e1) - 1) * 100;
            if (growth == 0) {
                peg = Number.NaN;
            } else {
                peg = round(p / e2 / growth, 3);
                target = round(growth * e2, 3);
                growth = round(growth, 3);
            }
        }
        return [growth, peg, target];
    }

    return {
        // 高管持股变动
        getGGCG: function (code) {
            var quote = new em_quote.Path({
                dataType: 'DC',
                reportType: 'GG',
                subReportType: 'GGC',
                param: { "code": "{1}" },
                sort: {
                    id: "2",
                    desc: true
                },
                page: '{0}',
                pagesize: 100
            });

            var x = new em_quote.Runner({
                host: 'datainterface.eastmoney.com',
                path: quote.path,
                urlParam: [code],
                csvFile: './cn-ggcg-hid/' + code + '.csv',
                header: function () {
                    //2.14441,徐福荣,002692,徐福荣,A股,2016-02-01,-7000000,46046000,12.5,远程电缆,本人,YCDL,大宗交易,-87500000,董事
                    // 0,     1,    2,    ,3,    4,  5,        ,6       ,7,       8,  ,9     ,10,  11,  12,    13       ,14
                    // 变动比例%,董监高人员姓名,代码,变动人,持股种类,日期,变动股数,变动后持股数,成交均价,名称,变动人与董监高的关系,,变动原因,(变动价额 / 10000).toFixed(2),职务';
                    return '变动比例%,董监高人员姓名,代码,变动人,持股种类,日期,变动股数,变动后持股数,成交均价,变动人与董监高的关系,变动原因,变动价额,职务';
                },
                refine: function (line) {
                    var cells = line.split(',');
                    if (cells.length === 15) {
                        return "{0},{1},{2},{3},{4},{5},{6},{7},{8},{9},{10},{11},{12}".format(
                            cells[0], cells[1], cells[2], cells[3], cells[4], cells[5], cells[6], cells[7], cells[8], cells[10], cells[12], cells[13], cells[14]);
                    }
                }
            });

            x.exec();
        },

        // 机构研报
        getGGSR: function (code) {
            var quote = new em_quote.Path({
                dataType: 'DC',
                reportType: 'SR',
                subReportType: 'GGSR',
                param: (code && code.length > 0 ? { "code": code } : { code: '', mkt: 0, stat: 0, cmd: 2 }),
                sort: {
                    id: "2",
                    desc: true
                },
                page: '{0}',
                pagesize: 20
            });

            var x = new em_quote.Runner({
                host: 'datainterface.eastmoney.com',
                path: quote.path,
                urlParam: [code],
                csvFile: './cn-ggsr-hid/' + code + '.csv',
                header: function () {
                    // http://data.eastmoney.com/report/20160519/APPH3nw7De7NASearchReport.html
                    // http://data.eastmoney.com/report/{报告日期}/{信息代码}.html
                    return '报告日期,股票,评级类别,评级变动,机构名称,研报,研报机构影响力,信息代码,机构代码,作者';
                },
                refine: function (item) {
                    return '{0},{1},{2},{3},{4},{5},{6},{7},{8},"{9}"'.format(
                        item.datetime, item.secuName, item.rate, item.change, item.insName, item.title, item.insStar, item.infoCode, item.insCode, item.author);
                }
            });

            x.exec(3);
        },

        //type=SR&sty=HYSR&mkt=0&stat=0&cmd=4&code=537&sc=&ps=25&p=3&js=var%20wjQKDzdr={%22data%22:[(x)],%22pages%22:%22(pc)%22,%22update%22:%22(ud)%22,%22count%22:%22(count)%22}&jsname={jsname}&rt=48787839
        // 行业研报
        getHYSR: function (code) {
            var quote = new em_quote.Path({
                dataType: 'DC',
                reportType: 'SR',
                subReportType: 'HYSR',
                param: { code: "{1}", mkt: 0, stat: 0, cmd: 4 },
                sort: {
                    id: "2",
                    desc: true
                },
                page: '{0}',
                pagesize: 20
            });

            var x = new em_quote.Runner({
                host: 'datainterface.eastmoney.com',
                path: quote.path,
                urlParam: [code],
                // csvFile: './cn-ggcg-hid/' + code + '.csv',
                header: function () {
                    return '报告日期,评级类别,评级变动,机构名称,研报,研报机构影响力,信息代码,机构代码,行业,行业代码';
                },

                // "无,2016/5/19 9:07:08,APPH3nw7Df3MIndustry,80066522,中投证券,4,545,持有,看好,专业工程：油气工程基本面及页岩油成本浅析,机械行业,1.08"
                refine: function (item) {
                    var cells = item.split(',');
                    return '{0},{1},{2},{3},{4},{5},{6},{7},{8},{9}'.format(
                        cells[1], cells[7], cells[8], cells[4], cells[9], cells[5], cells[2], cells[3], cells[10], cells[6]);
                }
            });

            x.exec();
        },

        // 业绩预告
        getYJYG: function () {
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
                urlParam: ['2016-12-31'],
                csvFile: './-hid/em_yjyg.csv',
                header: function () {
                    return unescape("序号,代码,名称,最新价,涨跌幅,研报数,买入,增持,中性,减持,卖出,2015收益,2016收益,2016PE,2017收益,2017PE,2018收益,2018PE,预留1,预留2,预留3");
                },
                refine: function (line) {
                    var cells = line.split(',');
                    if (cells.length === 9) {
                        return "{0},{1},\"{2}\",{3},{4},{5},{6}".format(cells[0], cells[1], cells[2].replace(/&sbquo/g, ','), cells[3], cells[4], cells[5], cells[7]);
                    }
                }
            });

            x.exec();
        },

        // 盈利预测
        getYLYC: function () {
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
                csvFile: './-hid/em_ylyc.csv',
                header: function () {
                    return unescape("序号,代码,名称,最新价,涨跌幅,研报数,买入,增持,中性,减持,卖出,2015收益,2016收益,2016PE,2017收益,2017PE,2018收益,2018PE,预留1");
                },
                refine: function (line) {
                    //? why should be removed
                    var removed = ['000003',
                        '000013',
                        '000015',
                        '000024',
                        '000033',
                        '000047',
                        '000405',
                        '000406',
                        '000412',
                        '000508',
                        '000515',
                        '000522',
                        '000527',
                        '000535',
                        '000542',
                        '000549',
                        '000556',
                        '000562',
                        '000569',
                        '000578',
                        '000583',
                        '000588',
                        '000594',
                        '000602',
                        '000618',
                        '000621',
                        '000653',
                        '000658',
                        '000660',
                        '000675',
                        '000689',
                        '000699',
                        '000730',
                        '000763',
                        '000765',
                        '000769',
                        '000787',
                        '000805',
                        '000817',
                        '000827',
                        '000832',
                        '000866',
                        '000956',
                        '002809',
                        '002810',
                        '002811',
                        '002812',
                        '300186',
                        '300534',
                        '300536',
                        '300537',
                        '300538',
                        '300539',
                        '300540',
                        '300541',
                        '300542',
                        '300543',
                        '600001',
                        '600002',
                        '600003',
                        '600065',
                        '600087',
                        '600092',
                        '600102',
                        '600181',
                        '600205',
                        '600253',
                        '600263',
                        '600286',
                        '600296',
                        '600357',
                        '600472',
                        '600553',
                        '600591',
                        '600607',
                        '600625',
                        '600627',
                        '600631',
                        '600632',
                        '600646',
                        '600656',
                        '600659',
                        '600669',
                        '600670',
                        '600672',
                        '600700',
                        '600709'];
                    var cells = line.split(',');
                    var item = removed.find((r) => {
                        return r === cells[1];
                    });
                    if (!item) {
                        return line;
                    }
                }
            });

            x.exec();
        },
        // 导出盈利预测和PEG
        gen: function () {
            // 序号,代码,名称,最新价,涨跌幅,研报数,买入,增持,中性,减持,卖出,2014收益,2015收益,2015PE,2016收益,2016PE,2017收益,2017PE
            // 序号,代码,名称,最新价,涨跌幅,研报数,买入,增持,中性,减持,卖出,2015收益,2016收益,2016PE,2017收益,2017PE,2018收益,2018PE
            // 0  ,1   ,2  ,3    ,4     ,5    ,6  ,7   ,8  ,9   ,10 ,11      ,12     ,13    ,14     ,15    ,16      ,17
            var docs = {}, // peg
                rs = {}; // ylyc
            var lines = myUtil.readlinesSync('./-hid/em_ylyc_bak.csv');
            for (var i = 1; i < lines.length; i++) {
                var cells = lines[i].split(',');
                if (cells.length > 1) {

                    var p = calcPEG(cells[11], cells[12], cells[14], cells[3]);
                    docs[cells[1]] = [p[0], p[1], p[2]];

                    // // debug
                    // if (cells[1] == '300119') {
                    //     console.log(cells[11], cells[12], cells[14], cells[3]);
                    //     console.log(p[0], p[1], p[2]);
                    // }

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
                    myUtil.toNumber(cells[17]),
                    myUtil.toNumber(cells[20])
                    ];
                }
            }

            fs.writeFile('../../daodao10.github.io/chart/dao/peg0.js', wrapRequireJs(JSON.stringify(docs, null, 1)), function (err) {
                if (err) {
                    throw err;
                }
                console.log('saved.');
            });
            fs.writeFile('../../daodao10.github.io/chart/dao/e0.js', wrapRequireJs(JSON.stringify(rs, null, 1)), function (err) {
                if (err) {
                    throw err;
                }
                console.log('saved.');
            });
        },

        // 业绩报表：个股数据下载
        getYJBB: function (code, reject, resolve) {
            _downloadFA(code, reject, resolve);
        },
        // 业绩报表：个股分析
        parseYJBB: function (code, reject, resolve) {
            _parseFA(code, reject, resolve);
        },
        // 业绩报表：批量处理
        // download：下载
        // parse：分析
        getYJBBBatch: function (action) {
            var func,
                symbolFile = '../chart/s/cn.txt';

            if (action === 'download') {
                func = _downloadFA;
            } else if (action === 'parse') {
                func = _parseFA;
            } else {
                throw new Error('don\'t support');
            }

            var
                settings = {
                    ChunkSize: 30
                },
                lines = myUtil.readlinesSync(symbolFile);

            lines.shift();
            lines = lines.chunk(settings.ChunkSize);

            (function fx(newRows, index, total, counter) {
                if (index == total) {
                    console.log("------------- processed %d -------------", counter);
                    return;
                }

                console.log(index);
                Promise.all(newRows[index].map(function (item) {
                    return new Promise(function (resolve, reject) {
                        if (item) {
                            var cells = item.split(',');

                            func(cells[1], reject, resolve);
                        } else {
                            reject('line empty');
                        }
                    }).catch(function (e) {
                        console.error('@getYJBBBatch', e);
                    });
                })).then(function (val) {
                    val.forEach(function (x) {
                        counter += (x === undefined ? 0 : x);
                    });

                    fx(newRows, index + 1, total, counter);
                });
            } (lines, 0, lines.length, 0));

        }
    };
}


var util = new EM();

// 业绩预告
// util.getYJYG();

// 获取业绩报表，分析业绩报表
// util.getYJBB('002710');
// util.getYJBBBatch('download');
// util.getYJBBBatch('parse');
// mv cn-fa-hid/*.json ../../daodao10.github.io/chart/fa/cn/

// 盈利预测
// 1)
// util.getYLYC();
// download ylyc files
// 2.a) processed by file
// (function (lines) {
//     lines.forEach((line) => {
//         var cells = line.split(',');
//         if (cells.length > 1) {
//             var code = cells[0];
//             console.log("wget -O ./cn-ylyc-hid/{0}.txt --referer \"http://f10.eastmoney.com/f10_v2/CapitalStockStructure.aspx?code={0}\" \"http://f10.eastmoney.com/f10_v2/ProfitForecast.aspx?code={0}\"".format(code));
//         }
//     });
// } (myUtil.readlinesSync('../chart/s/cn.txt')));
// 2.b) processed by item
// ['SH603306'].forEach(function (code) {
//     console.log("wget -O ./cn-ylyc-hid/{0}.txt --referer \"http://f10.eastmoney.com/f10_v2/CapitalStockStructure.aspx?code={0}\" \"http://f10.eastmoney.com/f10_v2/ProfitForecast.aspx?code={0}\"".format(code));
// });
// 3) get corp_action file
// node corp_action.js > -hid/corp_action.txt
// 4) 
// node em-ylyc_etl.js > -hid/em_ylyc_bak.csv
// 5)
// util.gen();

// 行业报告
// util.getHYSR('537');

// var wl = ['300156', '300148', '002669', '600093', '600298', '300049', '002111', '300048', '300119', '600419', '300342', '000639', '600405', '002072', '300025', '600114', '300232', '300095', '603306', '603168', '300243', '300398', '300219', '002531'];
// var length = wl.length, processed = 0;
// wl.forEach((item) => {
//     // // 业绩报表
//     // util.getYJBB(item, (err) => {
//     //     console.error(err);
//     // }, (data) => {
//     //     processed++;
//     //     if (processed == length) {
//     //         wl.forEach((item1) => {
//     //             util.parseYJBB(item1);
//     //         });
//     //     }
//     // });

//     // 机构研报
//     util.getGGSR(item);

//     // // 高管持股
//     util.getGGCG(item);
// });
