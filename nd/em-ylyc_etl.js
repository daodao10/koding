/**
 * http://f10.eastmoney.com/f10_v2/BackOffice.aspx?command=RptEarningsForecastDetails&paramCode=60029801&paramNum=0&paramType=&timetip=1472717177308
 * depends on:
 * 1) em_ylyc.csv: excute getYLYC in em2.js
 * 2) ylyc files under the folder cn-ylyc-hid: sh dl_ylyc.sh & sh dl_ylyc_2.sh
 * 3) corp_actions: node corp_action.js > -hid/corp_action.txt
 */
"use strict";
require('./ProtoUtil');

var fs = require('fs'),
    myUtil = require('./MyUtil'),
    em_quote = require('./EM_Quote');

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

function parseLast6Mon(input) {
    var x = _parse(/<tr class="bg"><th class="tips-fieldnameL">近六月平均<\/th><td class="tips-dataC">([0-9.-]+)<\/td><td class="tips-dataC">[0-9.-]+<\/td><td class="tips-dataC">([0-9.-]+)<\/td><td class="tips-dataC">([0-9.-]+)<\/td><td class="tips-dataC">([0-9.-]+)<\/td><td class="tips-dataC">([0-9.-]+)<\/td><td class="tips-dataC">([0-9.-]+)<\/td><td class="tips-dataC">([0-9.-]+)<\/td><\/tr>/ig,
        input, (m) => {
            return [m[1], m[2], m[3], m[4], m[5]];
        });
    if (x && x.length > 0) {
        return x[0];
    } else {
        return null;
    }
}

function parseDetails(input) {
    return _parse(/<tr><th class="tips-colnameL">(\d{4}-\d{2}-\d{2})<\/th><td class="tips-dataL">.+?<\/td><td class="tips-dataL">.+?<\/td><td class="tips-dataL">([.0-9-]+)<\/td><td class="tips-dataL">([.0-9-]+)<\/td><td class="tips-dataL">([.0-9-]+)<\/td><td class="tips-dataL">([.0-9-]+)<\/td><td class="tips-dataL">[0-9.-]+<\/td><td class="tips-dataL">[0-9.-]+<\/td><td class="tips-dataL">(.+?)<\/td><\/tr>/ig,
        input, (m) => {
            return [m[1], myUtil.toNumber(m[2]), myUtil.toNumber(m[3]), myUtil.toNumber(m[4]), myUtil.toNumber(m[5]), m[6]];
        });
}

function avg(arr) {
    var calc1 = function (val, s) {
        if (s == null) s = { sum: 0, count: 0 };
        if (val > 0) {
            s.sum += val;
            s.count += 1;

            return s
        }
        return s;
    }, calc2 = function (s) {
        if (s.count > 0) return s.sum / s.count;
        return 0;
    };


    var s2, s3, s4;
    arr.forEach((ele) => {
        s2 = calc1(ele[2], s2);
        s3 = calc1(ele[3], s3);
        s4 = calc1(ele[4], s4);
    });

    return [arr[0][1], calc2(s2).toFixed(4), calc2(s3).toFixed(4), calc2(s4).toFixed(4)];
}
function recommend(arr) {
    //买入,增持,中性,减持,卖出
    //Buy , Accumulate, Neutral, Reduce, Sell
    var r = { total: arr.length, buy: 0, acc: 0, neu: 0, reduce: 0, sell: 0 };
    arr.forEach((ele) => {
        switch (ele[5]) {
            case '买入':
                r.buy += 1;
                break;
            case '增持':
                r.acc += 1;
                break;
            case '中性':
                r.neu += 1;
                break;
            case '减持':
                r.reduce += 1;
                break;
            case '卖出':
                r.sell += 1;
                break;
        }
    });
    return r;
}
function fill(code, cells, corp_actions, forced, reject) {
    var srcFile = './cn-ylyc-hid/' + code + '.txt',
        dates;

    fs.readFile(srcFile, function (err, content) {
        if (err) {
            if (reject) reject(err);
            else console.error('@read', err);
        } else {

            // find it in corp_actions
            var corp = corp_actions && corp_actions.find((ele) => {
                return ele[0] === code;
            });

            // last 6: [ '0.34', '0.97', '21.46', '1.24', '16.57' ]
            // corp_actions:         
            // [ 'SH600298', '2016-04-29', 0, 15, 3, '2016-05-06' ]
            // details;
            // [ [ '2016-06-13', 0.3399, 0.62, 0.87, 1.09 ],
            //   [ '2016-06-12', 0.3399, 0.56, 0.73, 0.87 ],
            //   [ '2016-05-30', 0.3399, 0.6, 0.85, 0.97 ],
            //   [ '2016-05-17', 0.3399, 0.6, 0.85, 0.97 ],
            //   [ '2016-04-24', 0.3399, 1.32, 1.58, 1.86 ],
            //   [ '2016-04-20', 0.3399, 1.42, 1.79, NaN ] ]
            var x = corp || forced ? parseDetails(content) : parseLast6Mon(content),
                rec,
                updated = '201703', //TODO: hard code
                i;

            if (x && x.length > 0) {

                if (corp) {
                    var times = Math.ceil(corp[2] + corp[3]) / 10 + 1.0;
                    x = x.map(function (ele) {
                        if (ele[0] >= corp[5]) {
                            return ele;
                        } else {
                            return [ele[0], ele[1], ele[2] / times, ele[3] / times, ele[4] / times, ele[5]];
                        }
                    });
                }
                if (corp || forced) {
                    // console.log(x);
                    rec = recommend(x);
                    //[ 0.3399, 1.33, 1.51, 1.72 ]
                    x = avg(x);
                }

                if (cells) {
                    // 序号,代码,名称,最新价,涨跌幅,研报数,买入,增持,中性,减持,卖出,2015收益,2016收益,2016PE,2017收益,2017PE,2018收益,2018PE
                    // 0  ,1   ,2  ,3    ,4     ,5    ,6  ,7   ,8  ,9   ,10 ,11      ,12     ,13    ,14     ,15    ,16      ,17
                    if (corp) {
                        cells[11] = x[0];
                        cells[12] = x[1];
                        cells[14] = x[2];
                        cells[16] = x[3];
                    } else {
                        for (i = 11; i < 18; i++) {
                            cells[i] = x[i - 11];
                        }
                    }

                    cells[20] = updated;
                    print(cells);
                } else {
                    if (forced) {
                        cells = [code.startsWith('SH') ? '1' : '2',
                            code.substring(2),
                            '',
                            0, 0,
                            rec.total,
                            rec.buy,
                            rec.acc,
                            rec.neu,
                            rec.reduce,
                            rec.sell,
                            x[0],
                            x[1],
                            0,
                            x[2],
                            0,
                            x[3],
                            0,
                            0,
                            0,
                            updated];
                        print(cells);
                    } else {
                        console.dir(x);
                    }
                }

            } else {
                // console.log('>>>', code);
                print(cells);
            }
        }
    });
}

function print(cells) {
    if (cells && Array.isArray(cells))
        console.log(cells.join(','));
}


function main() {
    var corp_actions = (function (lines) {
        return lines.map(function (line, index) {
            if (index == 0) return null;
            var cells = line.split(',');
            // 代码,公告日期,送股(股),转增(股),派息(税前)(元),除权除息日
            cells[2] = myUtil.toNumber(cells[2]);
            cells[3] = myUtil.toNumber(cells[3]);
            cells[4] = myUtil.toNumber(cells[4]);
            if (cells[2] + cells[3] > 0) {
                // need to process
                cells[0] = (cells[0].startsWith('6') ? 'SH' : 'SZ') + cells[0];
                return cells;
            }
            else return null;
        });
    } (myUtil.readlinesSync("./-hid/corp_action.txt")));
    // corp_actions.forEach(function (r) {
    //     if (r)
    //         console.log('%s,%s,%d,%d,%d,%s', r[0], r[1], r[2], r[3], r[4], r[5]);
    // });

    var symbols = (function (lines) {
        var x = [], cells;
        lines.forEach((line, index) => {
            if (index === 0) return;
            cells = line.split(',');
            if (cells.length > 1) x.push(cells[0]);
        });
        return x;
    } (myUtil.readlinesSync('../chart/s/cn.txt')));

    var
        lines = myUtil.readlinesSync('./-hid/em_ylyc.csv'),
        line,
        list = [],
        notInList = [],
        i;
    for (i = 1; i < lines.length; i++) {
        line = lines[i];
        var cells = line.split(',');
        if (cells.length > 1) {
            var code = (cells[0] == '1' ? 'SH' : 'SZ') + cells[1];
            list.push(code);

            // process them in list (em-ylyc.csv)
            fill(code, cells, corp_actions.filter((ele) => {
                return ele !== null;
            }));
        }
    }

    // not in list
    // list.forEach((l) => {
    //     var item = symbols.find((s) => {
    //         return s === l;
    //     });

    //     if (!item) {
    //        notInList. push(l.substring(2));
    //     }
    // });
    symbols.forEach((s, index) => {
        var item = list.find((l) => {
            return s === l;
        });
        if (!item) {
            notInList.push(s);
        }
    });
    // console.log(notInList);

    // process them not in list
    notInList.forEach((n, index) => {
        fill(n, null, corp_actions.filter((ele) => {
            return ele !== null;
        }), true);
    });

    // fill('SH603306', null, corp_actions.filter((ele) => {
    //     return ele !== null;
    // }), true);
}

main();
