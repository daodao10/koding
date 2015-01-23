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

    "Y": { // newest to oldest
        IsCompactDate: false, //1990-01-01
        xCell: 0,
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
    }
};

if (process.argv.length > 2) {
    console.log("processing", process.argv[2]);
    batchProcess(process.argv[2]);
} else {
    console.log("USAGE: node opt_yahoo_etl.js <filename>");
}

// batchProcess();


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
                var matches = /\[(\w+)\s*:\s*(\w+)\s*:\s*(\w+)(,\s*(\w+))*\]/gi.exec(row);
                settings["source"] = etlUtil.encode_source(matches[1]);
                settings["market"] = matches[2];
                if (matches.length > 4) {
                    settings["period"] = [matches[3], matches[5]];
                } else {
                    settings["period"] = [matches[3]];
                }

                return;
            }

            for (var i in settings.period) {
                period = etlUtil.encode_period(settings.period[i]);
                cells = row.stripLineBreaks().split(',');
                if (settings.market === "sg") {
                    srcFile = "../{0}/dest/{1}.csv".format(settings.market, cells[0]);
                } else if (settings.market === "cn") {
                    if (cells[0].startsWith('SH')) {
                        srcFile = "../../wsWDZ/etl/SH/{0}.txt".format(cells[0]);
                    } else {
                        srcFile = "../../wsWDZ/etl/SZ/{0}.txt".format(cells[0]);
                    }
                } else { // common
                    srcFile = "{0}_{1}_{2}.csv".format(settings.market, cells[1], period);
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
            var array = data.toString().split("\n");

            if (settings.HasHeader) { // remove header
                array.shift();
            }
            if (settings.HasLastBlank) { // remove last blank line
                array.pop();
            }
            // sorting by date: newest to oldest
            if (settings.source !== "Y") {
                array.reverse();
            };

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
