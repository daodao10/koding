var fs = require("fs"),
    util = require('util');

var settings = {
    ItemFormat: "[new Date(%s, %s - 1, %s), %d, '%d']",
    "Y": {
        IsCompactDate: false,
        xCell: 0,
        yCell: 6
    },
    "SI": {
        IsCompactDate: true,
        xCell: 3,
        yCell: 8
    }
};


var dataFile = "history_GentingSing_20141111.csv",
    folder = "../../daodao10.github.io/chart/d/",
    outputFile = folder + "gp_sg.js",
    source = "SI";


generate(dataFile, outputFile);

function generate(filepath, newFile) {
    fs.readFile(filepath, function(err, data) {
        if (err) {
            console.log(err);
        } else {
            var array = data.toString().split("\n");

            array.shift();
            var data = array.map(mapFunc);

            var content = "var data=[" + data.join(',') + "];";

            fs.writeFile(newFile, content, function(err) {
                if (err) throw err;
                console.log("Saved!");
            });
        }
    });
}

function mapFunc(line) {
    var part = line.split(",");
    var yCell = part[settings[source].yCell];
    value = Math.log(yCell);
    if (isNaN(value) || value < -0) return null;
    var xCell = part[settings[source].xCell];
    return settings[source].IsCompactDate ?
        util.format(settings.ItemFormat, xCell.substring(0, 4), xCell.substring(4, 6), xCell.substring(6, 8), value, yCell) :
        util.format(settings.ItemFormat, xCell.substring(0, 4), xCell.substring(5, 7), xCell.substring(8, 10), value, yCell);
}
