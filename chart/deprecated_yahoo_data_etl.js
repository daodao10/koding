// this is for generating data from yahoo finance 
// please download csv file from yahoo historical price

var myUtil = require('../nd/MyUtil'),
    anounymous = require('../nd/ProtoUtil');

var rows = [],
    filename = '^spx_d.csv',
    count = 59, //valid record, exclude header & last blank line
    isQuarter = false,
    index = -1,
    isMonthly = false;

function func(data) {
    index++;

    if (index == 0) {
        return;
    }

    if (!isQuarter || (isQuarter && index % 3 == 1)) {
        var arr = data.split(',');
        // var date = Date.parse(arr[0]);
        var date = arr[0];
        period = isMonthly ? "{0}{1}".format(date.substring(0, 4), date.substring(5, 7)) :
            date.replace(/-/g, '');
        rows.push(JSON.stringify({
            "m": period,
            "o": arr[1],
            "h": arr[2],
            "l": arr[3],
            "c": arr[4]
        }));
    }

    if (index == count) {
        console.log(rows.join(","));
    }
}

myUtil.readlines(filename, func);
