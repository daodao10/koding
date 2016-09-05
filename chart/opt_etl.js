var fs = require("fs"),
    //Promise = require('promise'),
    myUtil = require('../nd/MyUtil'),
    anounymous = require('../nd/ProtoUtil'),
    etlUtil = require('./EtlUtil');

var settings = {
    DestFolder: "../../daodao10.github.io/chart/",
    ItemFormat: "['{0}',{1}]",
    // ItemFormat: "[new Date({0},{1},{2}),{3},{4}]",
    HasHeader: true,
    HasLastBlank: true,
    SortingOrder: 1, // 1 --accending, -1 -- decending

    "Y": { // Yahoo: newest to oldest
        IsCompactDate: false, //1990-01-01
        xCell: 0,
        yCell: 6
    },
    "G": { // Google: newest to oldest
        IsCompactDate: false, //1990-01-01
        xCell: 1,
        yCell: 6
    },
    "SI": {// shareinvestor.sg
        IsCompactDate: true, //19900101
        xCell: 3,
        yCell: 7
    },
    "SGX": {// sgx.com
        IsCompactDate: true,// set true when date format is yyyyMMdd or dateProcessor needed (e.g. 19/08/2013)
        xCell: 0,
        yCell: 4
    },
    "SQ": {// stooq.com
        IsCompactDate: false,
        xCell: 0,
        yCell: 4
    },
    "WS": {// wsstock.com
        IsCompactDate: true,
        xCell: 1,
        yCell: 6
    },
    "D": { // dao - customized
        IsCompactDate: false,
        xCell: 0,
        yCell: 1
    },
    ChunkSize: 200
};

// main function
if (process.argv.length > 2) {
    console.log("processing", process.argv[2]);
    batchProcess(process.argv[2]);
} else {
    console.log("USAGE: node opt_yahoo_etl.js <filename>");
}

function batchProcess(filename) {
    if (filename) {
        var lines = myUtil.readlinesSync(filename);

        myUtil.extend(settings, etlUtil.parse_setting(lines.shift()));
        settings["source"] = etlUtil.encode_source(settings["source"]);

        var newRows = [];
        lines.forEach(function (row) {
            if (row) {
                settings.period.map(function (period) {
                    newRows.push([row, period]);
                });
            }
        });

        newRows = newRows.chunk(settings.ChunkSize);

        fx(newRows, 0, newRows.length, 0);
    }
}

function fx(newRows, index, total, counter) {
    if (index == total) {
        console.log("------------- Saved %d -------------", counter);
        return;
    };

    Promise.all(newRows[index].map(function (item) {
        return new Promise(function (resolve, reject) {
            var period = etlUtil.encode_period(item[1]);
            var cells = item[0].stripLineBreaks().split(','),
                srcFile,
                destFile;
            if (settings["source"] === "SI") { // special case
                srcFile = "../{0}/dest-hid/{1}.csv".format(settings.market, cells[0]);
            } else if (settings["source"] === "WS") { // special case
                srcFile = "../../wsWDZ/{0}/{1}/{2}.txt".format(cells[4] == 1 ? "etl-2" : "etl", cells[0].startsWith('SH') ? "SH" : "SZ", cells[0]);
                if (!fs.existsSync(srcFile)) {
                    srcFile = "../../wsWDZ/{0}/{1}/{2}.txt".format("etl-2", cells[0].startsWith('SH') ? "SH" : "SZ", cells[0]);
                }
            } else { // normal
                // if (settings.market === "hk" && cells[6] == 1) { // specially process for hk ignored
                //     reject(new Error('ignore: ' + cells[1]));
                //     return;
                // }
                srcFile = "./d/{0}_{1}_{2}.csv".format(settings.market, cells[1], period);
            }

            destFile = "{3}{0}/{1}_{2}.js".format(settings.market, cells[1], period, settings.DestFolder);

            // console.log('params:', settings.source, period, srcFile, destFile);
            generate(srcFile, destFile, getDateProcessor(settings.source, period), resolve, reject);

        }).catch(function (e) {
            // console.error(e);
            if (e.code === 'ENOENT') {
                console.log("file is not found", e.path);
            } else {
                console.log("oh, no!", e.message);
            }
        });
    })).then(function (val) {
        val.forEach(function (x) {
            counter += (x == undefined ? 0 : x);
        });

        fx(newRows, index + 1, total, counter);
    });
}

function generate(srcFile, output, dateProcessor, resolve, reject) {
    fs.readFile(srcFile, function (err, data) {
        if (err) {
            reject(err);
        } else {
            data = data.toString();

            if ((/<title>Yahoo! - 404 Not Found<\/title>/gi).test(data)) {
                reject(new Error(srcFile));
            } else {
                var array = data.split("\n");

                if (settings.HasHeader) { // remove header
                    array.shift();
                }
                if (settings.HasLastBlank) { // remove last blank line
                    array.pop();
                }

                // replace with array.sort()
                // if (settings.SortingOrder === 1) {
                //     // sorting by date: oldest to newest
                //     if (settings.source === "Y" || settings.source === "G") {
                //         array.reverse();
                //     }
                // } else if (settings.SortingOrder === -1) {
                //     // sorting by date: newest to oldest
                //     if (settings.source !== "Y" && settings.source !== "G") {
                //         array.reverse();
                //     }
                // }

                var data = array.map(function (line) {
                    return mapFunc(line, dateProcessor);
                }).filter(function (element) {
                    return element != null;
                });

                // slow...
                data.sort();

                var content = "var data=[" + data.join(',\n') + "];\nvar source='" + etlUtil.decode_source(settings.source) + "';";
                fs.writeFile(output, content, function (err) {
                    if (err) {
                        reject(err);
                    }

                    resolve(1);
                });
            }
        }
    });
}

function getDateProcessor(source, period) {
    // special case: adjust end date of monthly data from yahoo
    if (source === "Y" && period === "m") {
        return function (dateStr) {
            // console.log(dateStr);
            return myUtil.getLastDateOfMonthFromStr(dateStr, {
                i: 0,
                l: 4
            }, {
                    i: 5,
                    l: 2
                }).format("yyyyMMdd");
        };
    } else if (source === "SGX") {
        return function (dateStr) {
            //19/08/2013: ddMMyyyy
            return dateStr.substr(6, 4) + dateStr.substr(3, 2) + dateStr.substr(0, 2);
        }
    }
    return null;
}

function mapFunc(line, dateFunc) {
    var part = line.stripLineBreaks().split(",");
    var yCell = part[settings[settings.source].yCell];
    var xCell = part[settings[settings.source].xCell];

    if (dateFunc) {
        xCell = dateFunc(xCell);
    }

    if (yCell == '0' || yCell == '') return null;
    return settings.ItemFormat.format(settings[settings.source].IsCompactDate ? xCell : xCell.replace(/-/g, ''), yCell);
    // value = Math.log(yCell) / Math.LN2;
    // if (isNaN(value)) return null; // || value < -0
    // return settings[settings.source].IsCompactDate ?
    //     settings.ItemFormat.format(xCell.substring(0, 4), parseInt(xCell.substring(4, 6), 10) - 1, xCell.substring(6, 8), value, yCell) :
    //     settings.ItemFormat.format(xCell.substring(0, 4), parseInt(xCell.substring(5, 7), 10) - 1, xCell.substring(8, 10), value, yCell);
}