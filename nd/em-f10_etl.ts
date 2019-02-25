/// <reference path="../../node.d.ts" />
/// <reference path="../../lib.es6.d.ts" />

// etl for f10.eastmoney.com
// api has been changed
// http://emweb.securities.eastmoney.com/f10_v2/CapitalStockStructure.aspx?type=web&code=sh600298
// http://emweb.securities.eastmoney.com/PC_HSF10/CapitalStockStructure/CapitalStockStructureAjax?code=sh600298

declare interface Options {
    path: string,
    charset: string,
    debug?: boolean
};

require('./ProtoUtil');
var fs = require('fs'),
    myUtil = require('./MyUtil'),
    MyMongo = require('./MyMongoUtil'),
    config = require('../config.json');

class EM3 {
    private _regExs: Array<RegExp>;
    public Capital: Array<Array<Object>>;
    private _myMongo: Object;

    constructor(regexs: Array<RegExp>) {
        this._regExs = regexs;
        this._myMongo = new MyMongo(`${config.DbSettings.DbUri}test`);
    }

    private _request(options: Options): Promise<any> {
        options = myUtil.extend({
            // host: 'f10.eastmoney.com'
            host: 'emweb.securities.eastmoney.com'
        }, options);
        return new Promise(function (resolve, reject) {
            myUtil.request(options, function (data, statusCode) {
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
    private _save(filePath: string, content: string): void {
        fs.writeFile(filePath, content, function (err) {
            if (err) {
                throw err;
            }
            console.log('saved.');
        });
    }
    private _parse(input: string, reg: RegExp): Array<any> {
        var result = [],
            m;
        while ((m = reg.exec(input))) {
            if (m.index === m.lastIndex) {
                m.lastIndex++;
            }
            result.push(m[1]);
        }
        return result;
    }

    private _logDbResult(msg: string, err: Error, result: Object) {
        if (err) {
            console.error(err);
        } else {
            console.log('%s done', msg);
            console.dir(result);
        }
    }

    capital_etl(code: string) {
        var options = {
            // path: '/f10_v2/CapitalStockStructure.aspx?type=web&code=' + code,
            path: `/PC_HSF10/CapitalStockStructure/CapitalStockStructureAjax?code=${code}`,
            charset: 'UTF-8',
            // debug: true
        };

        return new Promise((resolve, reject) => {
            this._request(options)
                .then((content: string) => {
                    // console.log(content);
                    var result = { _id: code, mv: null, nv: null };

                    // this._regExs.forEach((reg, index) => {
                    //     var x = this._parse(content, reg);
                    //     if (x) {
                    //         if (index == 0) result.mv = myUtil.toNumber(x[0]);
                    //         else result.nv = myUtil.toNumber(x[1]);
                    //     }
                    // });

                    var x = JSON.parse(content);
                    var shares = x.Result.UnlistedShareChangeList;
                    if (shares) {
                        result.mv = myUtil.toNumber(shares[1].changeList[0]);
                        result.nv = myUtil.toNumber(shares[2].changeList[0]);

                        // console.log(result);
                        this._myMongo.upsertBatch('counterCN', [result], function (err, result) {
                            if (err) {
                                // console.error(code, err);
                                reject(`${code}: ${err}`);
                            } else {
                                resolve(code);
                            }

                            // _this._logDbResult('update mv/nv to ' + code, err, result);
                        });
                    } else {
                        // console.debug(`UnlistedShareChangeList of ${code} is null`);
                        reject(`${code}: UnlistedShareChangeList is null`);
                    }
                }, (err) => {
                    // console.error(code, err);
                    reject(`${code}: ${err}`);
                });
        });
    }
}

async function xx(slice) {
    return Promise.all(slice.map((item) => em3.capital_etl(item)))
        .then((items) => {
            console.log(items);
            return items.length;
        }, (err) => {
            console.error('failed @', err);
            return 0;
        });
}

var em3 = new EM3([/<th class="tips-fieldnameL">股份总数<\/th><td class="tips-dataR">([0-9,.]+)<\/td>/ig,
    /<tr><th class="tips-fieldnameL">已上市流通A股<\/th><td class="tips-dataR">([0-9,.]+)<\/td>/ig]);
// // 1) single counter
// em3.capital_etl('sz002669');
// // 2) array of counter
// [
//     'SZ300575',
//     'SZ300576',
//     'SZ300577'
// ].forEach((code) => {
//     em3.capital_etl(code);
// });
// 3) symbol file
(function (lines) {

    let codes = lines.map((item) => {
        return (item.startsWith('6') ? 'SH' : 'SZ') + item;
    });

    // // to debug:
    // codes = codes.slice(2600, 4000);

    let chunkSize = 100;
    let chunk = codes.chunk(chunkSize);
    chunk.map(async (slice) => {
        let x = await xx(slice);
        console.log(`----------- ${x} done.`)
    });
}(myUtil.readlinesSync('./-hid/cn_symbol.txt')));
