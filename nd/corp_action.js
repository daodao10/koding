/*
 * get corporation actions from 
 * http://vip.stock.finance.sina.com.cn/corp/go.php/vISSUE_ShareBonus/stockid/{symbol}.phtml
 */
var fs = require('fs'),
    //Promise = require('promise'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil'),
    enabledAllotment = false;// 是否允许配股


function _get(symbol) {
    return new Promise(function (resolve, reject) {
        if (symbol) {
            myUtil.request({
                host: 'vip.stock.finance.sina.com.cn',
                path: '/corp/go.php/vISSUE_ShareBonus/stockid/' + symbol + '.phtml',
                "Upgrade-Insecure-Requests": 1,
                "charset": "GBK",
                // debug:true
            }, function (data, statusCode) {

                if (statusCode !== 200) {
                    console.error('error occurred: ', statusCode);
                    return reject({
                        url: symbol,
                        error: statusCode
                    });
                }

                parse(symbol, data);
                resolve(symbol);
            });
        } else {
            reject({ error: 'symbol is null' });
        }
    });
}

function _coreParse(reg, input, dataFunc) {
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

function parse(symbol, content) {
    var regex = enabledAllotment ?
        new RegExp("<table id=\"sharebonus_\\d\".*>([\\s\\w\\W]+?)<\/table>", "gi") :
        new RegExp("<table id=\"sharebonus_1\".*>([\\s\\w\\W]+?)<\/table>", "gi");

    var tableElements = content.match(regex);
    if (tableElements) {
        // the 1st table: distribute - share & cash
        // the 2nd table: allocate

        // console.log(symbol, "---");
        tableElements.forEach(function (tableContent) {
            var record = _coreParse(/<tr.*>\s*<td.*>(\d{4}-\d{2}-\d{2})<\/td>\s*<td>([0-9.]+)<\/td>\s*<td>([0-9.]+)<\/td>\s*<td>([0-9.]+)<\/td>\s*<td>实施<\/td>\s*<td.*>(\d{4}-\d{2}-\d{2})<\/td>/g, tableContent, function (action) {
                return [action[1], Number(action[2]), Number(action[3]), Number(action[4]), action[5]]
            });

            // print
            // console.log(record);
            record.forEach(function (r) {
                //TODO: update start date
                if (r[4] > '2017-07-01') {// && (r[1] > 0 || r[2] > 0)) {
                    console.log('%s,%s,%d,%d,%d,%s', symbol, r[0], r[1], r[2], r[3], r[4]);
                }
            });
        });
        // console.log("==========");

    }
}

function xx(symbols) {
    return Promise.all(symbols.map(_get))
        .then((items) => {
            return items.length;
        }, (err) => {
            console.error(err);
        });
}

function main() {
    if (!enabledAllotment) console.log('代码,公告日期,送股(股),转增(股),派息(税前)(元),除权除息日');

    let symbols = myUtil.readlinesSync("./-hid/cn_symbol.txt");

    let chunkSize = 100;
    let chunks = symbols.chunk(chunkSize);
    chunks.map(async (slice) => {
        let x = await xx(slice);
        console.log(`----------- ${x} done.`)
        await myUtil.sleep(myUtil.random(10000, 30000));
    });
}

main();
