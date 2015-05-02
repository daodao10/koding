/*
 * extract ADV/DEC & NH-NL data from http://unicorn.us.com/
 */

var fs = require('fs'),
    anounymous = require('../nd/ProtoUtil'),
    myUtil = require('../nd/MyUtil'),
    MyMongo = require('../nd/MyMongoUtil'),
    config = require('../config.json');

var markets = ['NYSE', 'AMEX', 'NASDAQ'],
    features = ['advn', 'decln', 'unchn', 'advv', 'declv', 'unchv', 'newhi', 'newlo'],
    columns = ['an', 'dn', 'un', 'av', 'dv', 'uv', 'nh', 'nl'],
    myMongo = new MyMongo("{0}{1}".format(config.DbSettings.QuotesDbUri, 'quotes'));

function firstRun() {

    var extract = function(market, startSequence) {
        var rowDic = {},
            rows = [];

        for (var i = 0; i < features.length; i++) {
            startSequence = readFeatureFile(market, features[i], columns[i], startSequence, rowDic);
        }

        //convert to array
        for (var k in rowDic) {
            rows.push(rowDic[k])
        }

        myMongo.insert('nhnl', rows, function(err, result) {
            if (err) {
                console.error(err);
                return;
            }
        });
        // console.log(rows);
    };

    var readFeatureFile = function(market, feature, column, startIndex, rowDic) {
        // curl -O http://unicorn.us.com/advdec/NYSE_advn.txt
        var lines = myUtil.readlinesSync("./{0}_{1}.txt".format(market, feature));
        if (!lines) return;

        var shortMarket = market.substr(0, 2),
            item,
            cells;

        for (var l in lines) {
            cells = lines[l].split(', ');
            if (cells.length != 2) continue;

            item = rowDic[cells[0]];
            if (!item) {
                item = {
                    "_id": startIndex++,
                    "d": cells[0],
                    "m": shortMarket
                };
            }
            item[column] = Number(cells[1]);

            rowDic[cells[0]] = item;
        }

        return startIndex;
    };


    extract(markets[0], 1);
    extract(markets[1], 50000);
    extract(markets[2], 100000);
}

function dailyRun() {

    var parseDailyData = function(data, dt) {
        var lines = data.split('\n'),
            rows = [];
        for (var i in lines) {
            if (i >= 2) {
                var cells = lines[i].split(',');
                if (cells.length === 9) {
                    var row;
                    for (var j in cells) {
                        if (j == 0) {
                            row = {
                                "d": dt,
                                "m": cells[j].trim().substr(0, 2)
                            };
                        } else {
                            row[columns[j - 1]] = Number(cells[j]);
                        }
                    }

                    rows.push(row);
                }
            }
        }

        return rows;
    };


    if (process.argv.length == 3) {
        var dt = process.argv[2];

        // curl -O http://unicorn.us.com/advdec/2015/adU20150326.txt
        myUtil.get({
            'host': 'unicorn.us.com',
            'path': '/advdec/{0}/adU{1}.txt'.format(dt.substr(0, 4), dt)
        }, function(data, statusCode) {
            if (statusCode !== 200) {
                console.error('error occurred:', statusCode);
                return;
            }
            var rows = parseDailyData(data.toString(), dt);
            for (var i in rows) {
                (function(row) {
                    myMongo.find("nhnl", {
                        q: {
                            m: row.m
                        },
                        s: {
                            _id: -1
                        },
                        o: {
                            limit: 1
                        }
                    }, function(err, docs) {
                        if (err) {
                            console.error(err);
                            return;
                        }

                        var seq = 1;
                        if (docs && docs.length === 1) {
                            seq = docs[0]._id + 1;
                        }

                        row["_id"] = seq;
                        myMongo.insert('nhnl', row, function(err, result) {
                            if (err) {
                                console.error(err);
                                return;
                            }

                            console.log('inserted', result.length);
                        });

                    });
                }(rows[i]));
            }
        });
    } else {
        console.log("USAGE: node nhnl_us_etl.js <date with format YYYYMMdd>");
    }
}


/* 
just run on the first time to initialize data
please download nhnl data first

curl -O http://unicorn.us.com/advdec/NYSE_advn.txt
curl -O http://unicorn.us.com/advdec/NYSE_decln.txt
curl -O http://unicorn.us.com/advdec/NYSE_unchn.txt
curl -O http://unicorn.us.com/advdec/NYSE_advv.txt
curl -O http://unicorn.us.com/advdec/NYSE_declv.txt
curl -O http://unicorn.us.com/advdec/NYSE_unchv.txt
curl -O http://unicorn.us.com/advdec/NYSE_newhi.txt
curl -O http://unicorn.us.com/advdec/NYSE_newlo.txt
curl -O http://unicorn.us.com/advdec/AMEX_advn.txt
curl -O http://unicorn.us.com/advdec/AMEX_decln.txt
curl -O http://unicorn.us.com/advdec/AMEX_unchn.txt
curl -O http://unicorn.us.com/advdec/AMEX_advv.txt
curl -O http://unicorn.us.com/advdec/AMEX_declv.txt
curl -O http://unicorn.us.com/advdec/AMEX_unchv.txt
curl -O http://unicorn.us.com/advdec/AMEX_newhi.txt
curl -O http://unicorn.us.com/advdec/AMEX_newlo.txt
curl -O http://unicorn.us.com/advdec/NASDAQ_advn.txt
curl -O http://unicorn.us.com/advdec/NASDAQ_decln.txt
curl -O http://unicorn.us.com/advdec/NASDAQ_unchn.txt
curl -O http://unicorn.us.com/advdec/NASDAQ_advv.txt
curl -O http://unicorn.us.com/advdec/NASDAQ_declv.txt
curl -O http://unicorn.us.com/advdec/NASDAQ_unchv.txt
curl -O http://unicorn.us.com/advdec/NASDAQ_newhi.txt
curl -O http://unicorn.us.com/advdec/NASDAQ_newlo.txt
*/
// firstRun();

dailyRun();
