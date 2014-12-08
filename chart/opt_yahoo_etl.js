var fs = require("fs"),
    util = require('util'),
    myUtil = require('../nd/MyUtil'),
    etlUtil = require('./EtlUtil');

var settings = {
    DestFolder: "../../daodao10.github.io/chart/",
    ItemFormat: "[new Date(%s, %s - 1, %s), %d, '%d']",
    HasHeader: true,
    HasLastBlank: true,

    "Y": {
        IsCompactDate: false,
        xCell: 0,
        yCell: 6
    },
    "SI": {
        IsCompactDate: true,
        xCell: 3,
        yCell: 7
    },
    "SQ": {
        IsCompactDate: false,
        xCell: 0,
        yCell: 4
    }
};

batchProcess('yahoo.txt');
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
                var matches = /\[(\w+)\s*:\s*(\w+)\s*:\s*(\w+),\s*(\w+)\]/gi.exec(row);
                settings["source"] = etlUtil.encode_source(matches[1]);
                settings["market"] = matches[2];
                settings["period"] = [matches[3], matches[4]];

                return;
            }

            for (var i in settings.period) {
                period = etlUtil.encode_period(settings.period[i]);
                cells = row.split(',');
                srcFile = "{0}_{1}_{2}.csv".format(settings.market, cells[1], period);
                destFile = "{3}{0}/{1}_{2}.js".format(settings.market, cells[1], period, settings.DestFolder);
                // console.log(srcFile, destFile);
                generate(srcFile, destFile);
            };

            // console.log("finished:", index.toString());
        });
    } else {
        // single src file

        var code = '^N225';
        settings["source"] = etlUtil.encode_source('stooq');
        settings["period"] = etlUtil.encode_period('daily');
        settings["market"] = 'world';

        srcFile = "{0}_{1}_{2}.csv".format(settings.market, code, settings.period);
        destFile = "{3}{0}/{1}_{2}.js".format(settings.market, code, settings.period, settings.DestFolder);
        generate(srcFile, destFile);

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
            if (settings.source === "SQ") {
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
    value = Math.log(yCell) / Math.LN2;
    if (isNaN(value)) return null; // || value < -0
    var xCell = part[settings[settings.source].xCell];
    return settings[settings.source].IsCompactDate ?
        util.format(settings.ItemFormat, xCell.substring(0, 4), xCell.substring(4, 6), xCell.substring(6, 8), value, yCell) :
        util.format(settings.ItemFormat, xCell.substring(0, 4), xCell.substring(5, 7), xCell.substring(8, 10), value, yCell);
}