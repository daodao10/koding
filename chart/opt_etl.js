var fs = require("fs"),
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

    "Y": { // newest to oldest
        IsCompactDate: false, //1990-01-01
        xCell: 0,
        yCell: 6
    },
    "G": { // newest to oldest
        IsCompactDate: false, //1990-01-01
        xCell: 1,
        yCell: 6
    },
    "SI": {
        IsCompactDate: true, //19900101
        xCell: 3,
        yCell: 7
    },
    "SQ": {
        IsCompactDate: false,
        xCell: 0,
        yCell: 4
    },
    "WS": {
        IsCompactDate: true,
        xCell: 1,
        yCell: 6
    },
    "D": {
        IsCompactDate: false,
        xCell: 0,
        yCell: 1
    }
};

// main function
if (process.argv.length > 2) {
    console.log("processing", process.argv[2]);
    batchProcess(process.argv[2]);
} else {
    console.log("USAGE: node opt_yahoo_etl.js <filename>");
}


function batchProcess(filename) {
    var index = 0,
        period,
        cells,
        srcFile,
        destFile;

    if (filename) {
        myUtil.readlines(filename, function(row) {
            index++;

            if (index === 1) {
                myUtil.extend(settings, etlUtil.parse_setting(row));
                settings["source"] = etlUtil.encode_source(settings["source"]);
                return;
            }

            for (var i in settings.period) {
                period = etlUtil.encode_period(settings.period[i]);
                cells = row.stripLineBreaks().split(',');
                if (settings.market === "sg") {
                    srcFile = "../{0}/dest/{1}.csv".format(settings.market, cells[0]);
                } else if (settings["source"] === "WS") {
                    if (cells[0].startsWith('SH')) {
                        srcFile = "../../wsWDZ/etl/SH/{0}.txt".format(cells[0]);
                    } else {
                        srcFile = "../../wsWDZ/etl/SZ/{0}.txt".format(cells[0]);
                    }
                } else { // common
                    srcFile = "./d/{0}_{1}_{2}.csv".format(settings.market, cells[1], period);
                }

                destFile = "{3}{0}/{1}_{2}.js".format(settings.market, cells[1], period, settings.DestFolder);
                // console.log(srcFile, destFile);
                generate(srcFile, destFile);
            };

            // console.log("finished:", index.toString());
        });
    }
}

function generate(srcFile, output) {
    fs.readFile(srcFile, function(err, data) {
        if (err) {
            console.log(err);
        } else {
            data = data.toString();

            if ((/<title>Yahoo! - 404 Not Found<\/title>/gi).test(data)) {
                console.log(srcFile);
                return;
            }

            var array = data.split("\n");

            if (settings.HasHeader) { // remove header
                array.shift();
            }
            if (settings.HasLastBlank) { // remove last blank line
                array.pop();
            }

            if (settings.SortingOrder === 1) {
                // sorting by date: oldest to newest
                if (settings.source === "Y" || settings.source === "G") {
                    array.reverse();
                }
            } else if (settings.SortingOrder === -1) {
                // sorting by date: newest to oldest
                if (settings.source !== "Y" && settings.source !== "G") {
                    array.reverse();
                }
            }

            var data = array.map(mapFunc);

            var content = "var data=[" + data.join(',') + "];\
                var source='" + etlUtil.decode_source(settings.source) + "';";

            fs.writeFile(output, content, function(err) {
                if (err) throw err;
                console.log("Saved!");
            });
        }
    });
}

function mapFunc(line) {
    var part = line.split(",");
    var yCell = part[settings[settings.source].yCell];
    var xCell = part[settings[settings.source].xCell];
    return settings.ItemFormat.format(settings[settings.source].IsCompactDate ? xCell : xCell.replace(/-/g, ''), yCell);
    // value = Math.log(yCell) / Math.LN2;
    // if (isNaN(value)) return null; // || value < -0
    // return settings[settings.source].IsCompactDate ?
    //     settings.ItemFormat.format(xCell.substring(0, 4), parseInt(xCell.substring(4, 6), 10) - 1, xCell.substring(6, 8), value, yCell) :
    //     settings.ItemFormat.format(xCell.substring(0, 4), parseInt(xCell.substring(5, 7), 10) - 1, xCell.substring(8, 10), value, yCell);
}
