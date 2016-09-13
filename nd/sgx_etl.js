/**
 * https://sgx-premium.wealthmsi.com/sgx/company/priceHistory 
 * https://sgx-premium.wealthmsi.com/sgx/search
*/

"use strict";
require('./ProtoUtil');

var
    fs = require('fs'),
    myUtil = require('./MyUtil'),
    vm = require('vm');


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

            return [ele.tickerCode, ele.companyName, ele.industry, ele.industryGroup];
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
 * export sg opt symbol list from sg_shareinvestor.txt
 */
function sg_opt_symbol_etl(minPrice) {
    (function (lines) {
        var x = [], cells, code, jsFile, last;
        lines.forEach((line, index) => {
            if (index === 0) return;
            cells = line.split(',');
            if (cells.length > 1) {
                code = cells[1];
                jsFile = '../../daodao10.github.io/chart/sg/' + code + '_d.js';
                if (loadJs(vm, jsFile)) {
                    last = data[data.length - 1];
                    if (last[1] >= minPrice) {
                        x.push({ "c": cells[1], "n": cells[2].toUpperCase(), "s": cells[4] });
                    }
                } else {
                    console.log('%s not found', code);
                }
            }
        });

        console.log(JSON.stringify(x));
    } (myUtil.readlinesSync('../chart/s/sg_shareinvestor.txt')));
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


function sg_indices_etl() {
    // etl sg_indices.txt from http://www.sgx.com/JsonRead/JsonData?qryId=NTP.INDICES
    var sgxIndices = require('./-hid/sgx_indices.json');
    var indices = sgxIndices.items.map(function (ele) {
        // if (ele.N.startsWith('FTSE ST')) {
        // console.log(ele.N, ele.PID);
        // }

        return [ele.N.toUpperCase() + " INDEX", ele.PID];
    });
    console.log(indices);
}

function export_sg_indices_dl() {
    // http://scr.trkd-hs.com/SGX-MarketInfo-ChartAPI/historical?ric=.FTFSTM
    (function (lines) {
        var cells;
        lines.forEach((line, index) => {
            if (index === 0) return;
            cells = line.split(',');
            if (cells.length > 1) {
                console.log('curl -o ./d/sg_%s_d.csv "http://scr.trkd-hs.com/SGX-MarketInfo-ChartAPI/historical?ric=%s"', cells[1], cells[0]);
            }
        });
    } (myUtil.readlinesSync('../chart/s/sg_indices.txt')));
}


// export_opt_data(['W05'], false);

// export_opt_data(null, true);
// export_opt_data(null, false);

// sg_opt_symbol_etl(0.2);
