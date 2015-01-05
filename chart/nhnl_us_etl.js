/*
extract ADV/DEC & NH-NL data from http://unicorn.us.com/
*/

var fs = require('fs'),
    anounymous = require('../nd/ProtoUtil'),
    myUtil = require('../nd/MyUtil'),
    MyMongo = require('../nd/MyMongoUtil'),
    config = require('../config.json');

var markets = ['NYSE', 'AMEX', 'NASDAQ'],
    features = ['advn', 'decln', 'unchn', 'advv', 'declv', 'unchv', 'newhi', 'newlo'],
    columns = ['an', 'dn', 'un', 'av', 'dv', 'uv', 'nh', 'nl'],
    myMongo = new MyMongo("{0}{1}".format(config.DbSettings.DbUri, 'quotes'));

function firstRun() {

    var extract = function(market, startSequence) {
        var rowDic = {},
            rows = [];

        for (var i = 0; i < features.length; i++) {
            startSequence = readFeatureFile(market, features[i], startSequence, rowDic);
        }

        //convert to array
        for (var k in rowDic) {
            rows.push(rowDic[k])
        }

        myMongo.insert('nhnl', rows);
        // console.log(rows);
    };

    var readFeatureFile = function(market, feature, startIndex, rowDic) {
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
            item[feature] = cells[1];

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

        myUtil.get({
            'host': 'unicorn.us.com',
            'path': '/advdec/2014/adU{0}.txt'.format(dt)
        }, function(data) {
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
                    }, function(docs) {
                        var seq = 1;
                        if (docs && docs.length === 1) {
                            seq = docs[0]._id + 1;
                        }

                        row["_id"] = seq;
                        myMongo.insert('nhnl', row, function(result) {
                            console.log('inserted', result.length);
                        });

                    });
                }(rows[i]));
            }
        });
    }
}


// firstRun();

dailyRun();
