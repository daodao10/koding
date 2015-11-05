/*
 * 
 */
var fs = require('fs'),
    //Promise = require('promise'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil');

function main() {

    myUtil.readlines("corp_action.txt", function(symbol) {
        // var symbol = '002740';
        _get(symbol).then(function(content) {

            var tableElements = content.match(/<table id="sharebonus_\d".*>([\s\w\W]+?)<\/table>/g);
            if (tableElements) {

                console.log(symbol, "---");
                tableElements.forEach(function(tableContent) {
                    // var records = _parse(/<table id="sharebonus_\d".*>([\s\w\W]+?)<\/table>/g, content, function(element) {
                    var record = _parse(/<tr.*>\s*<td.*>(\d{4}-\d{2}-\d{2})<\/td>\s*<td>([0-9.]+)<\/td>\s*<td>([0-9.]+)<\/td>\s*<td>([0-9.]+)<\/td>/g, tableContent, function(action) {
                        return [action[1], Number(action[2]), Number(action[3]), Number(action[4])]
                    });

                    console.log(record);
                    // return record;
                    // });
                });
                console.log("==========");
            }
        });
    });
}

function _get(symbol) {
    return new Promise(function(resolve, reject) {

        myUtil.get({
            host: 'vip.stock.finance.sina.com.cn',
            path: '/corp/go.php/vISSUE_ShareBonus/stockid/' + symbol + '.phtml',
            "Upgrade-Insecure-Requests": 1,
            "encoding": "gbk"
        }, function(data, statusCode) {

            if (statusCode !== 200) {
                console.error('error occurred: ', statusCode);
                reject({
                    url: url,
                    error: statusCode
                });
            }

            resolve(data);
        });
    });
}

function _parse(reg, input, dataFunc) {
    var result = [],
        m;
    while ((m = reg.exec(input))) {
        if (m.index === m.lastIndex) {
            m.lastIndex++;
        }
        result.push(dataFunc(m));
    }
    return result;
}

main();