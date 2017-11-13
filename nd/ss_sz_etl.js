/**
 * etl:
 * 1) extract SSE & SZSE market info from exchanges
 * 2) extract GDP data from http://data.stats.gov.cn/
 */
"use strict";
require('./ProtoUtil');

var fs = require('fs'),
    myUtil = require('./MyUtil'),
    iconv = require('iconv-lite'),
    CsvSerieUtil = require('./CsvSerieUtil'),
    MyMongo = require('./MyMongoUtil'),
    config = require('../config.json'),
    myMongo = new MyMongo("{0}{1}".format(config.DbSettings.DbUri, 'test')),
    mock = false;

function _request(options) {
    return new Promise(function (resolve, reject) {
        myUtil.request(options, function (data, statusCode) {
            if (options.debug) {
                console.log(options.path);
            }
            if (statusCode !== 200) {
                console.error('error occurred: ', statusCode);
                reject({
                    url: options.path,
                    error: statusCode
                });
            }

            resolve(data);
        });
    });
}

function _save(filePath, content) {
    fs.writeFile(filePath, content, function (err) {
        if (err) {
            throw err;
        }
        console.log('saved.');
    });
}

function toTimestamp(strDate, isCompact) {
    if (isCompact) {
        return new Date(parseInt(strDate.substring(0, 4), 10), parseInt(strDate.substring(4, 6), 10) - 1, parseInt(strDate.substring(6, 8))).getTime();
    }

    return new Date(parseInt(strDate.substring(0, 4), 10), parseInt(strDate.substring(5, 7), 10) - 1, parseInt(strDate.substring(8, 10))).getTime();
}

function logDbResult(msg, err, result) {
    if (err) {
        console.error(err);
    } else {
        console.log('%s done', msg);
        console.dir(result);
    }
}

var Market = {
    _update: function (rows, msg) {
        if (mock) {
            console.log(msg, rows.length);
            console.log('first', rows[0]);
        } else {
            myMongo.upsertBatch('marketCN', rows, function (err, result) {
                logDbResult(msg, err, result);
            });
        }
    },

    sumMV: function (startDate, endDate) {
        var self = this,
            dr = {
                start: toTimestamp(startDate, true),
                end: endDate ? toTimestamp(endDate, true) : new Date().getTime()
            };

        myMongo.find('marketCN', {
            q: { _id: { $gte: dr.start, $lte: dr.end } },
            f: { "mv_ss": 1, "mv_sz": 1, "nv_ss": 1, "nv_sz": 1 }
        }, function (err, docs) {
            docs.forEach(function (doc) {
                doc["mv"] = doc["mv_ss"] + doc["mv_sz"];
                doc["nv"] = doc["nv_ss"] + doc["nv_sz"];
            });

            self._update(docs, 'update MV & NV');
        });
    },

    updateSSEIndex: function (startDate, endDate) {
        if (!startDate) startDate = '19901219';
        if (!endDate) endDate = new Date().format('yyyyMMdd');

        var self = this;

        _request({
            host: 'quotes.money.163.com',
            path: '/service/chddata.html?code=0000001&start={0}&end={1}&fields=TCLOSE;HIGH;LOW;TOPEN'.format(startDate, endDate),
            charset: 'GBK'
        }).then(function (content) {
            var data = [],
                lines = content.split('\n'),
                cells,
                i;

            // prepare SSE index from money.163.com
            for (i = 1; i < lines.length; i++) {
                cells = lines[i].split(',');
                data.push([toTimestamp(cells[0], false), myUtil.toNumber(cells[3])]);
            }
            // console.log(data);

            myMongo.find('marketCN', {
                q: {},
                f: { _id: 1 }
            }, function (err, docs) {
                data.forEach(function (d) {
                    var item = docs.find(function (ele) {
                        return ele._id === d[0];
                    });
                    if (item) item["c_ss"] = d[1];
                });

                self._update(docs, 'update SSE index');
            });
        });
    },

    _buildRow: function (cell, market) {
        // date,transaction,volume,amount,pe,market value,negotiable value,exchange rate
        var x = {
            "_id": toTimestamp(cell[0], false)
        };
        x["tt_" + market] = myUtil.toNumber(cell[1]);//总成交笔数(万笔)
        x["tv_" + market] = myUtil.toNumber(cell[2]);//总成交股数(万股)
        x["ta_" + market] = myUtil.toNumber(cell[3]);//总成交金额(亿元)
        x["pe_" + market] = myUtil.toNumber(cell[4]);//平均市盈率
        x["mv_" + market] = myUtil.toNumber(cell[5]);//上市公司市价总值(亿元)
        x["nv_" + market] = myUtil.toNumber(cell[6]);//上市公司流通市值(亿元)
        x["er_" + market] = myUtil.toNumber(cell[7]);//股票平均换手率(%)
        return x;
    },
    update: function (market, line) {
        var rows = [this._buildRow(line.split(','), market)];
        this._update(rows, 'update market info ' + market);
    },
    updateBatch: function (market) {
        var rows = [],
            src = './-hid/' + market + '.csv',
            lines = myUtil.readlinesSync(src),
            i;

        for (i = 1; i < lines.length - 1; i++) {
            rows.push(this._buildRow(lines[i].split(','), market));
        }
        // console.log(rows);

        this._update(rows, 'batch update market info ' + market);
    },

    export: function () {
        myMongo.find("marketCN", { q: { mv: { $gt: 0 } }, f: { mv: 1, nv: 1, c_ss: 1 }, s: { _id: 1 } }, function (err, docs) {
            // console.log(JSON.stringify(docs));

            myMongo.find("GDP_Q", { q: {}, f: {}, s: { _id: 1 } }, function (err, gdps) {
                // console.log(JSON.stringify(gdps));

                var x = docs.map(function (doc) {
                    var gdp = GDP.ttm(doc._id, gdps);
                    // return { _id: doc._id, c: doc.c_ss, mv: doc.mv / gdp * 100, nv: doc.nv / gdp * 100 };
                    return [new Date(doc._id).format('yyyyMMdd'), doc.c_ss, doc.mv / gdp * 100, doc.nv / gdp * 100];
                });

                _save('./-hid/MV_cn.csv', '发布日期,收盘指数,总市场价值,流通市场价值\n' + x.join('\n'));
            });
        });
    }
};

var SSE = {
    _extract: function (json) {
        if (json.result && Array.isArray(json.result)) {
            var d = json.result[2];
            return "{0},{1},{2},{3},{4},{5},{6},{7}".format(d.searchDate, d.trdTm1, d.trdVol1, d.trdAmt1, d.profitRate1, d.marketValue1, d.negotiableValue1, d.exchangeRate);
        } else {
            return 'non-trading-date';
        }
    },

    etl: function (today, func) {
        var self = this;
        _request({
            host: 'query.sse.com.cn',
            // path:'/security/fund/queryAllIndexQuatNew.do?jsonCallBack=jsonpCallback62613&productId=000015&inMonth=201603&inYear=2016&searchDate=2016-03-02&prodType=4&_=1458750478815',
            path: '/marketdata/tradedata/queryTradingByProdTypeData.do?jsonCallBack=self._extract&searchDate={0}&prodType=gp&_={1}'.format(today, new Date().getTime()),
            headers: {
                // Cookie:"PHPStat_First_Time_10000011=1457371409512; PHPStat_Cookie_Global_User_Id=_ck16030801232916136963712121213; PHPStat_Main_Website_10000011=_ck16030801232916136963712121213%7C10000011%7C%7C%7C; PHPStat_Return_Count_10000011=4; PHPStat_Return_Time_10000011=1458918026357",
                Referer: "http://www.sse.com.cn/market/stockdata/overview/day/"
            },
            // debug: true
        }).then(function (content) {
            var x = eval(content);
            if (typeof func === 'function') {
                func(x);
            } else {
                console.log('nothing to do');
            }
        });
    },
    store: function (line) {
        Market.update('ss', line);
    }
};

var SZSE = {
    _parse: function (keyword, content) {
        var reg = new RegExp("<td.*?>" + keyword + "<\/td><td.*?>([0-9,.]+)<\/td>"),
            m;

        if (m = reg.exec(content)) {
            return myUtil.toNumber(m[1]);
        }
        return 0;
    },
    _extract: function (today, board, content) {
        // date,transaction,volume,amount,pe,market value,negotiable value,exchange rate
        var x = (board === 'sz' ?
            [today,
                null,
                null,
                this._parse('股票成交金额（元）', content) / 100000000,//亿元
                this._parse('股票平均市盈率', content),
                this._parse('股票总市值（元）', content) / 100000000,//亿元
                this._parse('股票流通市值（元）', content) / 100000000,//亿元
                this._parse('股票平均换手率', content)//%
            ] : [today,
                this._parse('总成交笔数', content) / 10000,//万笔
                this._parse('总成交股数', content) / 10000,//万股
                this._parse('总成交金额\\(元\\)', content) / 100000000,//亿元
                this._parse('平均市盈率\\(倍\\)', content),
                this._parse('上市公司市价总值\\(元\\)', content) / 100000000,//亿元
                this._parse('上市公司流通市值\\(元\\)', content) / 100000000,//亿元
                null//%
            ]);

        return "{0},{6},{7},{1},{2},{3},{4},{5}".format(x[0], x[3], x[4], x[5], x[6], x[7], x[1], x[2]);
    },

    // getDL: function (today) {
    //     console.log('curl -d "ACTIONID=7&AJAX=AJAX-TRUE&CATALOGID=1803&TABKEY=tab1&REPORT_ACTION=search&txtQueryDate={0}" "http://www.szse.cn/szseWeb/FrontController.szse" | iconv -f GBK -t utf-8 > ./-hid/{0}.txt'.format(today));
    // },
    // etl1: function (today) {
    //     var self = this,
    //         srcFile = './-hid/' + today + '.txt';
    //     fs.readFile(srcFile, function (err, data) {
    //         if (err) {
    //             if (reject) reject(err);
    //             else console.error('@read', err);
    //         } else {
    //             var content = data.toString();
    //             console.log(self._extract(today, content));
    //         }
    //     });
    // },

    _getTabIndex: function (board) {
        switch (board) {
            case 'sz':
                return 1;
            case 'szm':
                return 2;
            case 'zx':
                return 3;
            case 'cy':
                return 4;
        }
    },

    _validBoard: function (board) {
        switch (board) {
            case 'sz':
            case 'szm':
            case 'zx':
            case 'cy':
                return board;
            default:
                return 'sz';
        }
    },

    etl: function (today, func, board) {
        var self = this;
        board = self._validBoard(board);
        _request({
            host: 'www.szse.cn',
            path: '/szseWeb/FrontController.szse',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            // debug: true,
            data: "ACTIONID=7&AJAX=AJAX-TRUE&CATALOGID=1803&TABKEY=tab{0}&REPORT_ACTION=search&txtQueryDate={1}".format(self._getTabIndex(board), today)
        }).then(function (content) {
            if (typeof func === 'function') {
                func(self._extract(today, board, content), board);
            } else {
                console.log('nothing to do');
            }
        });
    },
    store: function (line, board) {
        Market.update(board, line);
    }
};

var GDP = {
    _getKeys: function (timestamp) {
        var keys,
            dt = new Date(timestamp),
            yr = dt.getFullYear(),
            mth = dt.getMonth();

        switch (mth) {
            case 0:
                yr--
            case 10:
            case 11:
                keys = [(yr - 1) + 'D', yr + 'A', yr + 'B', yr + 'C'];
                break;

            case 1:
            case 2:
            case 3:
                yr--;
                keys = [yr + 'A', yr + 'B', yr + 'C', yr + 'D'];
                break;

            case 4:
            case 5:
            case 6:
                yr--;
                keys = [yr + 'B', yr + 'C', yr + 'D', (yr + 1) + 'A'];
                break;

            case 7:
            case 8:
            case 9:
                keys = [(yr - 1) + 'C', (yr - 1) + 'D', yr + 'A', yr + 'B'];
                break;
        }

        // console.log(keys);
        return keys;
    },

    // http://data.stats.gov.cn/easyquery.htm?m=QueryData&dbcode=hgjd&rowcode=zb&colcode=sj&wds=%5B%5D&dfwds=%5B%7B%22wdcode%22%3A%22sj%22%2C%22valuecode%22%3A%221992-%22%7D%5D&k1=1472256990935
    etl: function () {
        _request({
            host: 'data.stats.gov.cn',
            path: '/easyquery.htm?m=QueryData&dbcode=hgjd&rowcode=zb&colcode=sj&wds=%5B%5D&dfwds=%5B%7B%22wdcode%22%3A%22sj%22%2C%22valuecode%22%3A%221992-%22%7D%5D&k1=1472258305872'
        }).then(function (data) {
            var json = JSON.parse(data),
                rows = [];
            json.returndata.datanodes.forEach(function (ele) {
                if (ele.wds[0].valuecode == 'A010101') {
                    rows.push({ _id: ele.wds[1].valuecode, v: ele.data.data });
                }
            });
            if (mock) {
                console.log(rows);
            } else {
                myMongo.upsertBatch('GDP_Q', rows, function (err, result) {
                    logDbResult('update GDP_Q', err, result);
                });
            }
        });
    },

    ttm: function (timestamp, gdps) {
        if (!gdps) gdps = [{ "_id": "1992A", "v": 5262.8 }, { "_id": "1992B", "v": 6484.3 }, { "_id": "1992C", "v": 7192.6 }, { "_id": "1992D", "v": 8254.8 }, { "_id": "1993A", "v": 6834.6 }, { "_id": "1993B", "v": 8357 }, { "_id": "1993C", "v": 9385.8 }, { "_id": "1993D", "v": 11095.9 }, { "_id": "1994A", "v": 9375.1 }, { "_id": "1994B", "v": 11481 }, { "_id": "1994C", "v": 12868 }, { "_id": "1994D", "v": 14913.3 }, { "_id": "1995A", "v": 12111.7 }, { "_id": "1995B", "v": 14612.9 }, { "_id": "1995C", "v": 16164.1 }, { "_id": "1995D", "v": 18451.2 }, { "_id": "1996A", "v": 14628 }, { "_id": "1996B", "v": 17147.5 }, { "_id": "1996C", "v": 18605.8 }, { "_id": "1996D", "v": 21432.4 }, { "_id": "1997A", "v": 16689.1 }, { "_id": "1997B", "v": 19163.6 }, { "_id": "1997C", "v": 20500.9 }, { "_id": "1997D", "v": 23361.5 }, { "_id": "1998A", "v": 18049.1 }, { "_id": "1998B", "v": 20296.6 }, { "_id": "1998C", "v": 21775.6 }, { "_id": "1998D", "v": 25074.2 }, { "_id": "1999A", "v": 19361.9 }, { "_id": "1999B", "v": 21567.7 }, { "_id": "1999C", "v": 23050.8 }, { "_id": "1999D", "v": 26583.9 }, { "_id": "2000A", "v": 21329.9 }, { "_id": "2000B", "v": 24043.4 }, { "_id": "2000C", "v": 25712.5 }, { "_id": "2000D", "v": 29194.3 }, { "_id": "2001A", "v": 24086.4 }, { "_id": "2001B", "v": 26726.6 }, { "_id": "2001C", "v": 28333.3 }, { "_id": "2001D", "v": 31716.8 }, { "_id": "2002A", "v": 26295 }, { "_id": "2002B", "v": 29194.8 }, { "_id": "2002C", "v": 31257.3 }, { "_id": "2002D", "v": 34970.3 }, { "_id": "2003A", "v": 29825.5 }, { "_id": "2003B", "v": 32537.3 }, { "_id": "2003C", "v": 35291.9 }, { "_id": "2003D", "v": 39767.4 }, { "_id": "2004A", "v": 34544.6 }, { "_id": "2004B", "v": 38700.8 }, { "_id": "2004C", "v": 41855 }, { "_id": "2004D", "v": 46739.8 }, { "_id": "2005A", "v": 40453.3 }, { "_id": "2005B", "v": 44793.1 }, { "_id": "2005C", "v": 48047.8 }, { "_id": "2005D", "v": 54024.8 }, { "_id": "2006A", "v": 47078.9 }, { "_id": "2006B", "v": 52673.3 }, { "_id": "2006C", "v": 56064.7 }, { "_id": "2006D", "v": 63621.6 }, { "_id": "2007A", "v": 57177 }, { "_id": "2007B", "v": 64809.6 }, { "_id": "2007C", "v": 69524.3 }, { "_id": "2007D", "v": 78721.4 }, { "_id": "2008A", "v": 69410.4 }, { "_id": "2008B", "v": 78769 }, { "_id": "2008C", "v": 82541.9 }, { "_id": "2008D", "v": 88794.3 }, { "_id": "2009A", "v": 74053.1 }, { "_id": "2009B", "v": 83981.3 }, { "_id": "2009C", "v": 90014.1 }, { "_id": "2009D", "v": 101032.8 }, { "_id": "2010A", "v": 87616.7 }, { "_id": "2010B", "v": 99532.4 }, { "_id": "2010C", "v": 106238.7 }, { "_id": "2010D", "v": 119642.5 }, { "_id": "2011A", "v": 104641.3 }, { "_id": "2011B", "v": 119174.3 }, { "_id": "2011C", "v": 126981.6 }, { "_id": "2011D", "v": 138503.3 }, { "_id": "2012A", "v": 117593.9 }, { "_id": "2012B", "v": 131682.5 }, { "_id": "2012C", "v": 138622.2 }, { "_id": "2012D", "v": 152468.9 }, { "_id": "2013A", "v": 129747 }, { "_id": "2013B", "v": 143967 }, { "_id": "2013C", "v": 152905.3 }, { "_id": "2013D", "v": 168625.1 }, { "_id": "2014A", "v": 140618.3 }, { "_id": "2014B", "v": 156461.3 }, { "_id": "2014C", "v": 165711.9 }, { "_id": "2014D", "v": 181182.5 }, { "_id": "2015A", "v": 149987.7 }, { "_id": "2015B", "v": 167651.2 }, { "_id": "2015C", "v": 175616 }, { "_id": "2015D", "v": 192250.8 }, { "_id": "2016A", "v": 160710.2 }, { "_id": "2016B", "v": 179926.6 }, { "_id": "2016C", "v": 189334 }];

        var sum = 0;

        this._getKeys(timestamp).forEach(function (key) {
            var item = gdps.find(function (ele) {
                return ele._id === key;
            });
            sum += item.v;
        });

        return sum;
    }
};

function etl() {
    // workflow:

    // @first time: 1),2)
    // Market.updateBatch('ss');
    // Market.updateBatch('sz');
    // Market.sumMV('20050104');
    // Market.updateSSEIndex();


    // batch process
    var dts = [
        '20171101',
        '20171102',
        '20171103',
        '20171106',
        '20171107',
        '20171108',
        '20171109',
        '20171110',
    ];

    // // 1) etl sse & szse
    // dts.forEach(function(item) {
    //     var dt = item;
    //     dt = dt.substr(0, 4) + "-" + dt.substr(4, 2) + "-" + dt.substr(6, 2);

    //     // SSE.etl(dt, console.log);
    //     // SZSE.etl(dt, console.log, 'sz');
    //     // SZSE.etl(dt, console.log, 'szm');
    //     // SZSE.etl(dt, console.log, 'zx');
    //     // SZSE.etl(dt, console.log, 'cy');

    //     SSE.etl(dt, SSE.store);
    //     SZSE.etl(dt, SZSE.store, 'sz');
    //     SZSE.etl(dt, SZSE.store, 'szm');
    //     SZSE.etl(dt, SZSE.store, 'zx');
    //     SZSE.etl(dt, SZSE.store, 'cy');
    // });

    // // 2.1) sum market cap
    // Market.sumMV (dts[0]);
    // // 2.2) update SSE index
    // Market.updateSSEIndex(dts[0]);

    // // 2.3) etl GDP by quarter
    // GDP.etl();

    // // 3) export market value from db
    // Market.export();

    // // 4) export market value json file
    // var util = new CsvSerieUtil(false);
    // util.extract('./-hid/MV_cn.csv', '../../daodao10.github.io/chart/swi/mv.json');
}

etl();
// console.log(toTimestamp('20161223',true));
// console.log(GDP.ttm(toTimestamp('201701021',true)));
// Market.updateBatch('cy');
