var fs = require("fs"),
    path = require("path"),
    util = require('util');


// return "[new Date(%s, %s, %s), %d]".format(
//         part[1].substring(0, 4), part[1].substring(4, 6), part[1].substring(6, 8), Math.log(part[6]));


// var dir = "/Users/dao/Downloads/wsWDZ/etl/m/SH/";
// var counter = "SH000001";

// function getProcessingFile(counter, output) {
//     if (output) {
//         return util.format("%s/%s.js", dir, counter);
//     } else {
//         return util.format("%s/%s.txt", dir, counter);
//     }
// }

// generate(getProcessingFile(counter), getProcessingFile(counter, true));


function generate(filepath, newFile) {
    fs.readFile(filepath, function(err, data) {
        if (err) {
            console.log(err);
        } else {
            var array = data.toString().split("\n");
            var length = array.length;
            var data = [];
            var item;
            for (var i = 1; i < length - 1; i++) {
                item = filter(array[i]);
                if (item) {
                    data.push(item);
                }
            };
            var content = "var data=[" + data.join(',') + "];";

            fs.writeFile(newFile, content, function(err) {
                if (err) throw err;
                console.log("Saved!");
            });
            // console.log(content);
        }
    });
}

function filter(line) {
    var part = line.split(",");
    // console.log("[new Date(%s, %s, %s), %d],", 
    //   part[1].substring(0,4), part[1].substring(4,6),part[1].substring(6,8), Math.log(part[6]));
    var value = Math.log(part[6]);
    if (isNaN(value) || value < -0) return null;
    return util.format("[new Date(%s, %s - 1, %s), %d, '%d']",
        part[1].substring(0, 4), part[1].substring(4, 6), part[1].substring(6, 8), value, part[6]);
}

function driven(func) {
    var p = "/Users/dao/Downloads/wsWDZ/etl/m/SZ/"
    fs.readdir(p, function(err, files) {
        if (err) {
            throw err;
        }

        var x = files.map(function(file) {
            return path.join(p, file);
        }).filter(function(file) {
            return fs.statSync(file).isFile() && path.extname(file) == ".txt";
        });
        // .forEach(function(file) {
        //     console.log("%s (%s)", file, path.extname(file));
        // });

        func(x);
    });
}

function output2Files(fileList) {
    fileList.forEach(function(file) {
        var newFile = path.join(path.dirname(file), path.basename(file, '.txt') + '.js');
        generate(file, newFile);
    });

    // console.log("fileList is %s\nx type is %s", fileList, typeof(fileList));
}

function printSymbols(x) {
    x.forEach(function(file) {
        console.log("<option value=\"%s.js\">%s</option>", path.basename(file, '.txt'), path.basename(file, '.txt').substring(2));
    });
}

// driven(output2Files);
driven(printSymbols);