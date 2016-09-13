/**
 * etl for MSCI https://www.msci.com/webapp/indexperf/charts?baseValue=false&currency=15&priceLevel=0&site=gimi&scope=C&endDate=31%20Dec,%202016&frequency=M&format=XML&startDate=31%20Dec,%201969&indices=13,C,30|100016,C,30|106,C,36
 */
"use strict";
require('./ProtoUtil');

var libxmljs = require("libxmljs"),
    fs = require('fs'),
    myUtil = require('./MyUtil');

function _get(indices) {
    var options = {
        host: 'www.msci.com',
        path: '/webapp/indexperf/charts?baseValue=false&currency=15&priceLevel=0&site=gimi&scope=C&endDate=31%20Dec,%202016&frequency=M&format=XML&startDate=31%20Dec,%201969&indices=' + indices,
        "Upgrade-Insecure-Requests": 1
    };

    return new Promise(function (resolve, reject) {
        myUtil.request(options, function (data, statusCode) {
            if (statusCode !== 200) {
                reject({
                    url: options.path,
                    error: statusCode
                });
            }

            resolve(data);
        });
    });
}

function _save(filePath, content) {
    fs.writeFile(filePath, content, function (err) {
        if (err) {
            throw err;
        }
        console.log('saved.');
    });
}

_get('13,C,30|100016,C,30|106,C,36').then((xml) => {
    var doc = libxmljs.parseXmlString(xml);
    var indices = doc.find('//index');

    indices.forEach((index, i) => {
        var id = index.attr('id').value(), fileName;

        switch (id) {
            case 'CHINA A 50,C,30':
                fileName = 'MSCI-CHINA-A50_m.js';
                break;
            case 'EM (EMERGING MARKETS),C,30':
                fileName = 'MSCI-EM_m.js';
                break;
            case 'WORLD,C,36':
                fileName = 'MSCI-WORLD_m.js';
                break;
            default:
                fileName = 'MSCI-UNKNOWN.js';
        }

        var items = index.find('asOf'),
            d,
            v,
            rows = items.map((item, j) => {
                d = item.child(1).text();
                d = d.substr(6, 4) + d.substr(0, 2) + d.substr(3, 2);
                v = myUtil.toNumber(item.child(3).text()).toFixed(3);
                return "['{0}',{1}]".format(d, v);
            });

        _save('../../daodao10.github.io/chart/world/' + fileName, "var data=[" + rows.join(',\n') + "];\nvar source=\"www.msci.com\"");
    });

}, (err) => {
    console.error(err);
});
