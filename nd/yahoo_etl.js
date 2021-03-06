/**
 * extract counter info by yahoo api
 */
var fs = require('fs'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil'),
    MyMongo = require('./MyMongoUtil'),
    config = require('../config.json');


function get(options) {
    return new Promise(function (resolve, reject) {
        myUtil.request(options, function (data, statusCode) {
            if (statusCode !== 200) {
                console.error('error occurred: ', statusCode);
                reject({
                    url: options.path,
                    error: statusCode
                });
            }

            resolve(data);
        });
    });
}
function save(csvFile, data) {
    fs.writeFile(csvFile, data, function (err) {
        if (err) {
            throw err;
        }
        console.log('saved.');
    });
}

function updateLastPrice(counter) {
    var
        options = {
            host: 'download.finance.yahoo.com',
            path: '/d/quotes.csv?s={0}&f=d1l1'.format(counter[0])
        },
        mock = false;

    get(options).then(function (data) {
        // console.log(data);
        // "11/10/2016",2167.48
        if (data) {
            var
                arr = data.stripLineBreaks().split(','),
                dateArr = arr[0].replace(/"/g, '').split('/'),
                dt = new Date(myUtil.toNumber(dateArr[2]), myUtil.toNumber(dateArr[0]) - 1, myUtil.toNumber(dateArr[1])),
                doc = {
                    "_id": dt.format('yyyyMMdd'),
                    "c": Number(arr[1])
                };

            if (mock) {
                console.log(data);
                console.log(doc);
            } else {
                var myMongo = new MyMongo("{0}{1}".format(config.DbSettings.DbUri, 'test'));
                myMongo.insert(counter[1], doc, function (err, insertResult) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log(insertResult.ops);
                    }
                });
            }
        }
    });
}

[
    ['^GSPC', 'spx'],
    ['^IXIC', 'ndq'],
    ['^RUT', 'rut']
].forEach(function (item) {
    updateLastPrice(item);
});
