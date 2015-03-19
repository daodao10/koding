var os = require('os'),
    fs = require('fs'),
    MyMongo = require('./MyMongoUtil'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil'),
    config = require('./config.json');


var EOL = os.EOL,
    myMongo = new MyMongo("{0}{1}".format(config.DbSettings.DbUri, 'em')),
    today = process.argv.length > 2 ? process.argv[2] : new Date().format('yyyyMMdd');



function highlight(func, todayOnly) {
    if (func) {
        myMongo.find("test", {
            q: (todayOnly ? {
                $and: [{
                    d: today
                }, {
                    mm: {
                        $gt: 50
                    }
                }]
            } : {
                mm: {
                    $gt: 50
                }
            }),
            s: {
                s: 1
            }
        }, function(err, docs) {
            if (err) {
                console.error(err);
                return;
            }
            func(docs, "highlight-{0}.csv".format(today));
        });
    }
}

function notice(func, todayOnly) {

    myUtil.readlines('../learning/capture/note.txt', function(row) {

        if (row && func) {
            myMongo.find("test", {
                q: (todayOnly ? {
                    $and: [{
                        s: row
                    }, {
                        d: today
                    }]
                } : {
                    s: row
                }),
                s: {
                    s: 1
                }
            }, function(err, docs) {
                if (err) {
                    console.error(err);
                    return;
                }
                func(docs, "note-{0}.csv".format(today));
            });
        }

    });
}

function outputFunc(rows, fileName) {
    var lines = [];
    var row;
    for (var i in rows) {
        row = rows[i];
        lines.push('{0},{1},{2},{3},{4},{5},{6},{7}'.format(
            row.s, row.d, row.mm, truncate(row.mi1), truncate(row.mi2), truncate(row.c1), truncate(row.c20), row.cmm.trim()));
        lines.push(EOL);
    }
    if (lines.length > 0) {
        fs.appendFileSync(fileName, lines.join(''), {
            'encoding': 'utf-8'
        });
    }
}


function truncate(x) {
    var num = 0;
    if ((typeof x) == "string") {
        num = Number(x);
    } else num = x;

    return num.toFixed(2);
}

highlight(outputFunc, true);

notice(outputFunc, true);
