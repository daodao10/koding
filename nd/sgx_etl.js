/**
 * 1)
 * https://sgx-premium.wealthmsi.com/sgx/company/priceHistory 
 * Request Method:POST
 * application/json : {id: "AAJ"}
 * https://sgx-premium.wealthmsi.com/sgx/search
 * 2)
 * https://sgx-premium.wealthmsi.com/sgx/company
 * Request Method:POST
 * application/json : {id: "AAJ"}
*/

"use strict";
require('./ProtoUtil');

var
    fs = require('fs'),
    vm = require('vm'),
    requirejs = require('requirejs'),
    myUtil = require('./MyUtil'),
    cu = require('./CounterUtil');

var counterUtil = new cu.CounterUtil('counterSG');


function loadJs(vm, filename) {
    if (fs.existsSync(filename)) {
        try {
            var content = fs.readFileSync(filename);
            vm.runInThisContext(content);
            return true;
        }
        catch (err) {
            console.error('unknown something wrong', err);
        }
    } else {
        console.log("file %s doesn't exist", filename);
    }
    return false;
};

function _post(options) {
    options = myUtil.extend({
        host: 'sgx-premium.wealthmsi.com',
        secure: true,
        port: 443,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    }, options);
    // same command
    // curl -H "Content-Type: application/json" -X POST  --data '{ "id": "1A0" }'  https://sgx-premium.wealthmsi.com/sgx/company/priceHistory

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

function _get(options) {
    options = myUtil.extend({
        host: 'www.sgx.com'
    }, options);

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

function _getPriceHistory(code) {
    var options = {
        path: '/sgx/company/priceHistory',
        data: JSON.stringify({ "id": code })
    };

    return _post(options);
}

function _search(criteria) {
    var options = {
        path: '/sgx/search',
        data: JSON.stringify({ "criteria": criteria })
    };

    return _post(options);
}

function _getCompnayInfo(code) {
    var options = {
        path: '/sgx/company',
        // debug:true,
        data: JSON.stringify({ "id": code })
    };

    return _post(options);
}

function _save(filePath, content) {
    fs.writeFile(filePath, content, function (err) {
        if (err) {
            throw err;
        }
        console.log('saved.');
    });
}

/**
 * etl symbol from sgx.com
 */
function sg_symbol_etl() {
    _search([]).then(function (data) {
        data = JSON.parse(data);
        var x = data.companies.map(function (ele) {
            if (ele.companyName && ele.companyName.indexOf(',') >= 0) ele.companyName = ele.companyName.replace(',', '');
            if (ele.industry && ele.industry.indexOf(',') >= 0) ele.industry = ele.industry.replace(',', ' |');
            if (ele.industryGroup && ele.industryGroup.indexOf(',') >= 0) ele.industryGroup = ele.industryGroup.replace(',', ' |');

            return [ele.tickerCode, ele.companyName, ele.industryGroup, ele.industry];
        });

        console.log('symbol,code,name,sector[shareinvestor : sg : daily]');
        //STI.SI,STI,STRAITS TIMES INDEX (STI),Index
        x.forEach(function (ele) {
            console.log("%s.SI,%s,%s,%s,%s", ele[0], ele[0], ele[1], ele[2], ele[3]);
        })
    }).catch(function (err) {
        console.log(err);
    });
}

/**
 * export sg opt symbol list from db
 */
function sg_opt_symbol_etl(minPrice) {
    counterUtil.get({}, (err, docs) => {
        var x = [], code, jsFile, last;
        docs.forEach((doc) => {
            code = doc.code;
            jsFile = '../../daodao10.github.io/chart/sg/' + code + '_d.js';
            if (loadJs(vm, jsFile)) {
                last = data[data.length - 1];
                if (last[1] >= minPrice) {
                    x.push(JSON.stringify({ "c": doc.code, "n": doc.name.toUpperCase(), "s": doc.sector, "mv": doc.mv }));
                }
            } else {
                console.log('%s not found', code);
            }
        });

        console.log(x.join(',\n'));
    });
}
function export_opt_data(symbols, isIndex) {
    var
        _dateProcessor = function (dateStr) {
            //19/08/2013: ddMMyyyy
            return dateStr.substr(6, 4) + dateStr.substr(3, 2) + dateStr.substr(0, 2);
        },
        _export = function (data, jsFile) {
            var x = data.map((ele) => {
                return "['{0}',{1}]".format(ele[0], ele[1].toFixed(4));
            });

            _save(jsFile, "var data=[" + x.join(',\n') + "];\nvar source=\"www.sgx.com\"");
        },
        _securityHandler = function (code) {
            _getPriceHistory(code).then(function (content) {
                var
                    json = JSON.parse(content),
                    x = json.price.map((ele) => {
                        return [new Date(parseInt(ele.date)).format('yyyyMMdd'), ele.value];
                    });

                var jsFile = '../../daodao10.github.io/chart/sg/' + code + '_d.js';
                if (loadJs(vm, jsFile)) {
                    var last = data[data.length - 1]
                    x.forEach(function (ele) {
                        if (ele[0] > last[0]) {
                            data.push(ele);
                        }
                    });
                    _export(data, jsFile);
                    // console.log(data);
                } else {
                    _export(x, jsFile);
                }
            }).catch(function (err) {
                console.log(code, ':', err);
            });
        },
        _indexHandler = function (code) {
            fs.readFile("../chart/d/sg_" + code + "_d.csv", function (err, content) {
                if (err) {
                    console.log(code, ':', err);
                } else {
                    content = content.toString();

                    var x = content.split("\n");
                    // remove header
                    x.shift();
                    // remove last blank line
                    x.pop();

                    x = x.map(function (row) {
                        var record = row.stripLineBreaks().split(",");
                        return [_dateProcessor(record[0]), myUtil.toNumber(record[4])];
                    });

                    var jsFile = '../../daodao10.github.io/chart/sg/' + code + '_d.js';
                    if (loadJs(vm, jsFile)) {
                        var last = data[data.length - 1]
                        x.forEach(function (ele) {
                            if (ele[0] > last[0]) {
                                data.push(ele);
                            }
                        });
                        _export(data, jsFile);
                        // console.log(data);
                    } else {
                        _export(x, jsFile);
                    }

                }
            });
        };

    if (symbols && Array.isArray(symbols)) {
        symbols.forEach((code) => {
            if (isIndex) _indexHandler(code);
            else _securityHandler(code);
        });
    } else {
        // export from sg_shareinvestor.txt
        (function (lines) {
            var cells;
            lines.forEach((line, index) => {
                if (index === 0) return;

                cells = line.split(',');
                if (cells.length > 1) {
                    var code = cells[1];

                    if (isIndex) { // process for index
                        if (index < 23) {
                            console.log('process', code);
                            _indexHandler(code);
                        }
                    } else { // process for security
                        if (index > 22) {
                            _securityHandler(code);
                        }
                    }
                }

            });
        } (myUtil.readlinesSync('../chart/s/sg_shareinvestor.txt')));
    }
}

function save_sg_company(symbols) {
    if (symbols && Array.isArray(symbols)) {
        symbols.forEach((code) => {
            _getCompnayInfo(code).then(function (content) {
                _save('./sg-company-hid/' + code + '.json', content);
            });
        });
    } else {
        (function (lines) {
            var cells;
            lines.forEach((line, index) => {
                if (index === 0) return;
                cells = line.split(',');
                if (cells.length > 1) {
                    var code = cells[1];
                    if (index > 22) {
                        _getCompnayInfo(code).then(function (content) {
                            _save('./sg-company-hid/' + code + '.json', content);
                        });
                    }
                }
            });
        } (myUtil.readlinesSync('../chart/s/sg_shareinvestor.txt')));
    }
}

function storeToDB() {
    // symbol,code,name,sector,industry
    (function (lines) {
        var docs = [];
        lines.forEach((line, index) => {
            if (index == 0) return;
            var cells = line.split(',');
            docs.push({
                _id: cells[0],
                code: cells[1],
                name: cells[2],
                sector: cells[3],
                industry: cells[4]
            });
        });
        counterUtil.update(docs, 'insert qualitified docs');
    } (myUtil.readlinesSync('../chart/s/sg_shareinvestor.txt')));
}
function patch() {
    // var query = { sector: { $ne: 'Index' } };
    var query = { $and: [{ sector: { $ne: 'Index' } }, { mv: null }] };
    counterUtil.get(query, (err, docs) => {
        if (err) {
            console.error(err);
            return;
        }

        var updated = false;
        docs.forEach((doc) => {
            var filename = './sg-company-hid/' + doc.code + '.json';
            if (fs.existsSync(filename)) {
                var content = fs.readFileSync(filename, 'utf8');
                var json = JSON.parse(content);
                doc['mv'] = (json.company && json.company.companyInfo ? json.company.companyInfo.sharesOutstanding : null);
                updated = true;
            } else {
                console.log('cannot find', doc.code);
            }
        });

        if (updated)
            counterUtil.update(docs, 'patch for counterSG');
    });
}

// sg_symbol_etl();
sg_opt_symbol_etl(0.15);

// export_opt_data([
//     '5UJ',
//     'ADJ',
//     'Z74'
// ], false);
// export_opt_data(null, true);
// export_opt_data(null, false);

// save_sg_company();
// save_sg_company([
//     '1A1',
//     '1B1',
//     'A17U'
// ]);

// storeToDB();
// patch();
