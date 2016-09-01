/**
 * etl for http://www.cnindex.com.cn/
 */
"use strict";
require('./ProtoUtil');

var fs = require('fs'),
    myUtil = require('./MyUtil');

function _get(options) {
    return new Promise(function (resolve, reject) {
        myUtil.get(options, function (data, statusCode) {
            if (options.debug) {
                console.log(options.path);
            }
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

function _save(filePath, content) {
    fs.writeFile(filePath, content, function (err) {
        if (err) {
            throw err;
        }
        console.log('saved.');
    });
}

function getCNY(code, startDate, endDate) {
    var options = {
        //http://www.cnindex.com.cn/indexHq.doz?parseData=1&flowno=59277&stockCode=CNYX&market=sz&timestamp=1471583306454&startTime=2016-05-18&endTime=2016-08-19&count=300&funcno=70001
        host: 'www.cnindex.com.cn',
        path: '/indexHq.doz?parseData=1&flowno=59277&stockCode={0}&market=sz&timestamp=1471583306454&startTime={1}&endTime={2}&count=300&funcno=70001'.format(code, startDate, endDate),
        // debug: true
    };

    _get(options).then(function (data) {
        var
            json = JSON.parse(data),
            rows = [];

        if (json.indexHq) {
            json.indexHq.forEach(function (item) {
                rows.push("['{0}',{1}]".format(new Date(item[0]).format('yyyyMMdd'), item[4]));
            });

            _save('../../daodao10.github.io/chart/world/' + code + '_d.js',
                "var data=[" + rows.join(',\n') + "];\nvar source=\"www.cnindex.com.cn\"");
        }
        else {
            console.log('data issue');
        }
    }, (err) => {
        console.error(err);
    });
}

var today = (new Date()).format('yyyy-MM-dd');
getCNY('CNYX', '2010-06-19', today);
getCNY('CNYR', '2010-06-19', today);
