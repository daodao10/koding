// this is for generating data from yahoo finance 
// please download csv file from yahoo historical price

var myUtil = require('./MyUtil'),
    util = require('util');

var rows = [],
    // filename = 'sse.csv',
    // count = 286,
    // filename = 'note-10-year-yield-rate.csv',
    filename = 'spx.csv',
    count = 635,
    index = 0;

function func(data) {
    index++;

    if (index == 1) {
        return;
    }

    var arr = data.split(',');
    // var date = Date.parse(arr[0]);
    var date = arr[0];
    rows.push(JSON.stringify({
        "m": util.format("%s%s", date.substring(0, 4), date.substring(5, 7)),
        "o": arr[1],
        "h": arr[2],
        "l": arr[3],
        "c": arr[4]
    }));

    if (index == count) {
        console.log(rows.join(","));
    }
}

myUtil.readlines(filename, func);
