/*
generate download shell script
*/

var fs = require("fs"),
    util = require('util'),
    myUtil = require('../nd/MyUtil'),
    anounymous = require('../nd/ProtoUtil'),
    etlUtil = require('./EtlUtil');

var enableWGET = false;
//-rw-r--r--  1 dao  staff  \s*\d+ Jan  3 \d{2}:\d{2} \./d/us_([A-Z0-9-]+)_d\.csv
//TODO: update
var ignoredList = [
    // 'AAL',
    // 'AAN',
    // 'AAP',
    // 'ZX'
];


function main() {
    var index = 0,
        action,
        filename,
        setting = {
            sorting: 0 // 0: disabled, 1: sorting by code, 2: sorting by name
        },
        period,
        start,
        // today = new Date(),
        today = new Date(2017, 0, 31),
        dropdownList = [],
        cells,
        lines;

    if (process.argv.length < 4) {
        console.log("USAGE: node opt_pre_etl <filename> <action>");
        console.log("action: ");
        console.log("\t0: output processing file");
        console.log("\t1: output download command");
        console.log("\t2: output dropdown list");
        return;
    } else if (process.argv.length === 4) {
        console.log("# processing", process.argv[2]);
        filename = process.argv[2];
        action = parseInt(process.argv[3], 10);
    }

    if (filename == undefined || action == undefined) {
        console.log("wrong parameters");
        return;
    }

    if (action === 0 || action === 1) {
        myUtil.readlines(filename, function (row) {
            index++;

            if (index === 1) {
                if (action === 0) {
                    // console.log("symbol,code,name,sector[yahoo : world : monthly, daily]");
                    // console.log("symbol,code,name,sector[stooq : world : monthly, daily]");
                    // console.log("symbol,code,name,sector[shareinvestor : sg : daily]");
                    // console.log("symbol,code,name,sector[yahoo : hk : daily]");
                    // console.log("symbol,code,name,sector[yahoo : us : daily]");
                    console.log("symbol,code,name,sector[wstock : cn : daily]");
                } else {
                    setting = myUtil.extend(setting, etlUtil.parse_setting(row));

                    setting["end"] = today;
                    return;
                }
            }

            cells = row.stripLineBreaks().split(',');
            if (action === 0) {
                // console.log('%s,%s,%s,%s', cells[0], cells[0].replace('.SI', ''), cells[1], '--');
                // console.log('%s,%s,%s,--', cells[0], cells[0], cells[1]);
                // console.log('%s.HK,%s,%s,--', cells[0].substring(1), cells[0], cells[1]);
                console.log('%s%s,%s,%s,--', cells[0].startsWith('0') || cells[0].startsWith('3') || cells[0].startsWith('15') ? 'SZ' : 'SH',
                    cells[0] === '999999' ? '000001' : cells[0], cells[0], cells[1]);
            } else if (action === 1) {
                if (setting.source === "stooq") {
                    setting.period.forEach(function (period) {
                        if (setting.period === "daily") {
                            start = new Date(today.getFullYear() - 30, 0, 1);
                        } else {
                            start = new Date(today.getFullYear() - 50, 0, 1);
                        }

                        console.log(_output_stooq_download_link(
                            start.format('yyyyMMdd'), setting.end.format('yyyyMMdd'), setting.market, cells[0], cells[1], period, period === "monthly"));

                    });
                } else if (setting.source === "yahoo") {

                    setting.period.forEach(function (period) {

                        if (ignoredList.some((element) => {
                            return element === cells[0];
                        })) return;

                        if (setting.period === "daily") {
                            start = new Date(today.getFullYear() - 30, 0, 1);
                        } else {
                            start = new Date(today.getFullYear() - 50, 0, 1);
                        }

                        console.log(_output_yahoo_download_link(
                            start.getMonth().toString(), start.getDate().toString(), start.getFullYear().toString(),
                            setting.end.getMonth().toString(), setting.end.getDate().toString(), setting.end.getFullYear().toString(),
                            setting.market, cells[0], cells[1], period));
                    });
                }
            }
        });
    } else if (action === 2) {

        // console.log(_output_dropdown_list(setting.market, cells[1], cells[2], cells[3]));
        lines = myUtil.readlinesSync(filename);
        for (var i = 0; i < lines.length; i++) {
            if (i === 0) {
                setting = myUtil.extend(setting, etlUtil.parse_setting(lines[i]));
            } else {
                cells = lines[i].split(',');
                if (setting.market == "hk") {
                    dropdownList.push(_output_dropdown_list1(setting.market, cells[1], cells[2] + "-" + cells[3], cells[4], cells[5]));
                } else if (cells.length > 3) {
                    dropdownList.push(_output_dropdown_list(setting.market, cells[1], cells[2], cells[3]));
                }
            }
        }

        if (setting.sorting === 1) {
            dropdownList.sort(function (obj1, obj2) {
                if (obj1.c > obj2.c) {
                    return 1;
                } else if (obj1.c < obj2.c) {
                    return -1;
                }
                return 0;
            });
        } else if (setting.sorting === 2) {
            dropdownList.sort(function (obj1, obj2) {
                if (obj1.n > obj2.n) {
                    return 1;
                } else if (obj1.n < obj2.n) {
                    return -1;
                }
                return 0;
            });
        }

        fs.writeFile("{0}_.js".format(setting.market), JSON.stringify(dropdownList), {
            "encoding": 'utf-8'
        }, function (err) {
            if (err) {
                throw err;
            }
            console.log("{0}_.js saved".format(setting.market));
        });
    } else if (action === 3) {

        var symbols = myUtil.readlinesSync(filename),
            srcFile;

        for (var i = 1; i < symbols.length; i++) {

            cells = symbols[i].split(',');
            if (cells.length > 1) {
                console.log(cells[0]);
                if (cells[0].startsWith('SH')) {
                    srcFile = "../../wsWDZ/etl/SH/{0}.txt".format(cells[0]);
                } else {
                    srcFile = "../../wsWDZ/etl/SZ/{0}.txt".format(cells[0]);
                }

                var newLines = [],
                    pre_date = '';
                lines = myUtil.readlinesSync(srcFile);
                if (lines) {
                    for (var j = 0; j < lines.length; j++) {
                        if (j === 0) {
                            newLines.push(lines[j]);
                        } else {
                            cells = lines[j].split(',');
                            if (cells[1] > pre_date) {
                                pre_date = cells[1];
                                newLines.push(lines[j]);
                            }
                        }
                    }

                    fs.writeFileSync(srcFile, newLines.join('\r\n') + '\r\n');
                }
            }
        }

    }
}

main();


function _output_dropdown_list(market, code, name, sector) {
    // return '"{1}": {"n":"{2}", "s": "{3}"},'.format(market, code, name, sector);
    return {
        "c": code,
        "n": name.toUpperCase(),
        "s": sector
    }
}

function _output_dropdown_list1(market, code, name, sector, industry) {
    // return '"{1}": {"n":"{2}", "s": "{3}"},'.format(market, code, name, sector);
    return {
        "c": code,
        "n": name.toUpperCase(),
        "s": sector,
        "i": industry
    }
}

function _output_stooq_download_link(start, end, market, symbol, code, type, ignoreDateRange) {
    type = etlUtil.encode_period(type);
    if (ignoreDateRange) {
        if (enableWGET) return 'wget -O ./d/{4}_{5}_{3}.csv "http://stooq.com/q/d/l/?s={2}&i={3}"'.format(start, end, symbol, type, market, code);
        else return 'curl -o ./d/{4}_{5}_{3}.csv "http://stooq.com/q/d/l/?s={2}&i={3}"'.format(start, end, symbol, type, market, code);
    }
    if (enableWGET) return 'wget -O ./d/{4}_{5}_{3}.csv "http://stooq.com/q/d/l/?s={2}&d1={0}&d2={1}&i={3}"'.format(start, end, symbol, type, market, code);
    else return 'curl -o ./d/{4}_{5}_{3}.csv "http://stooq.com/q/d/l/?s={2}&d1={0}&d2={1}&i={3}"'.format(start, end, symbol, type, market, code);
}

function _output_yahoo_download_link(a, b, c, d, e, f, market, symbol, code, type) {
    type = etlUtil.encode_period(type);
    if (enableWGET) return 'wget -O ./d/{8}_{9}_{7}.csv "http://real-chart.finance.yahoo.com/table.csv?s={6}&a={0}&b={1}&c={2}&d={3}&e={4}&f={5}&g={7}&ignore=.csv"'.format(a, b, c, d, e, f, symbol, type, market, code);
    else return 'curl -o ./d/{8}_{9}_{7}.csv "http://real-chart.finance.yahoo.com/table.csv?s={6}&a={0}&b={1}&c={2}&d={3}&e={4}&f={5}&g={7}&ignore=.csv"'.format(a, b, c, d, e, f, symbol, type, market, code);
}

function _get_mid_term_date(reference, offsetYear) {
    return new Date(reference.getFullYear() + offsetYear, reference.getMonth(), reference.getDate());
}