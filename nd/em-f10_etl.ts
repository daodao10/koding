/// <reference path="../../node.d.ts" />
// etl for f10.eastmoney.com
// http://f10.eastmoney.com/f10_v2/CapitalStockStructure.aspx?code=sh600298

"use strict";

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
        this._myMongo = new MyMongo("{0}{1}".format(config.DbSettings.DbUri, 'test'));
    }

    private _request(options: Object): Promise {
        options = myUtil.extend({
            host: 'f10.eastmoney.com'
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
    private _save(filePath: String, content: string): void {
        fs.writeFile(filePath, content, function (err) {
            if (err) {
                throw err;
            }
            console.log('saved.');
        });
    }
    private _parse(input: String, reg: RegExp): Array {
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

    private _logDbResult(msg: String, err: Error, result: Object) {
        if (err) {
            console.error(err);
        } else {
            console.log('%s done', msg);
            console.dir(result);
        }
    }

    capital_etl(code: String) {
        var options = {
            path: '/f10_v2/CapitalStockStructure.aspx?code=' + code,
            // debug: true
        };
        this._request(options).then((content: String) => {
            // console.log(content);
            var result = { _id: code };

            this._regExs.forEach((reg, index) => {
                var x = this._parse(content, reg);
                if (x) {
                    if (index == 0) result.mv = myUtil.toNumber(x[0]);
                    else result.nv = myUtil.toNumber(x[1]);
                }
            });

            // console.log(result);
            this._myMongo.upsertBatch('counterCN', [result], function (err, result) {
                _this._logDbResult('update mv/nv to ' + code, err, result);
            });
        });
    }
}

var em3 = new EM3([/<th class="tips-fieldnameL">股份总数<\/th><td class="tips-dataR">([0-9,.]+)<\/td>/ig,
    /<tr><th class="tips-fieldnameL">已上市流通A股<\/th><td class="tips-dataR">([0-9,.]+)<\/td>/ig]);
// // 1)
// em3.capital_etl('sz002669');
// // 2)
// [
//     'SZ300575',
//     'SZ300576',
//     'SZ300577'
// ].forEach((code) => {
//     em3.capital_etl(code);
// });
// // 3)
// (function (lines) {
//     lines.forEach((item, index) => {
//         // if (index > 500) return;

//         // if (index < 500) return;
//         // if (index > 1000) return;
//         // if (index < 1000) return;
//         // if (index > 1500) return;
//         // if (index < 2000) return;
//         // if (index > 2500) return;
//         // if (index < 2500) return;
//         // if (index > 3000) return;

//         // if (index < 3000) return;
//         if (item) {
//             item = (item.startsWith('6') ? 'SH' : 'SZ') + item;
//             em3.capital_etl(item);
//         }
//     });
// } (myUtil.readlinesSync('./-hid/symbol.txt')));
