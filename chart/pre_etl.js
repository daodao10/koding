/*
generate download shell script
*/

var fs = require("fs"),
    util = require('util'),
    myUtil = require('../nd/MyUtil'),
    anounymous = require('../nd/ProtoUtil'),
    etlUtil = require('./EtlUtil');

function main() {
    var index = 0,
        action,
        filename,
        setting = {},
        period,
        start,
        today = new Date(),
        dropdownList = [],
        cells;

    if (process.argv.length <= 2) {
        console.log("USAGE: node pre_etl <filename> <action>");
        console.log("action: ");
        console.log("\t0: output processing file");
        console.log("\t1: output download command");
        console.log("\t2: output dropdown list");
        return;
    } else if (process.argv.length === 4) {
        console.log("processing", process.argv[2]);
        filename = process.argv[2];
        action = parseInt(process.argv[3], 10);
    }

    if (filename == undefined || action == undefined) {
        console.log("wrong parameters");
        return;
    }

    if (action === 0 || action === 1) {
        myUtil.readlines(filename, function(row) {
            index++;

            if (index === 1) {
                if (action === 0) {
                    // console.log("symbol,code,name,sector[yahoo : world : monthly, daily]");
                    // console.log("symbol,code,name,sector[stooq : world : monthly, daily]");
                    // console.log("symbol,code,name,sector[shareinvestor : sg : daily]");
                    console.log("symbol,code,name,sector[yahoo : hk : daily]");
                    // console.log("symbol,code,name,sector[yahoo : us : daily]");
                    // console.log("symbol,code,name,sector[wstock : cn : daily]");
                } else {
                    setting = etlUtil.parse_setting(row);
                    if (setting.market === "world") {
                        setting["start"] = new Date(today.getFullYear() - 50, 0, 1);
                    } else {
                        setting["start"] = new Date(today.getFullYear() - 25, 0, 1);
                    }
                    setting["end"] = today;
                }
                return;
            }

            cells = row.stripLineBreaks().split(',');
            if (action === 0) {
                // console.log('%s,%s,%s,%s', cells[0], cells[0].replace('.SI', ''), cells[1], '--');
                // console.log('%s,%s,%s,--', cells[0], cells[0], cells[1]);
                console.log('%s.HK,%s,%s,--', cells[0].substring(1), cells[0], cells[1]);
            } else if (action === 1) {
                if (setting.source === "stooq") {

                    for (var i in setting.period) {
                        period = setting.period[i];
                        if (period === "daily") {
                            start = _get_mid_term_date(setting.end, -5);
                        } else {
                            start = setting.start;
                        }

                        console.log(_output_stooq_download_link(
                            start.format('yyyyMMdd'), setting.end.format('yyyyMMdd'), setting.market, cells[0], cells[1], period, period === "monthly"));
                    }

                } else if (setting.source === "yahoo") {

                    for (var i in setting.period) {
                        period = setting.period[i];
                        if (setting.market === "world" && period === "daily") {
                            start = _get_mid_term_date(setting.end, -5);
                        } else {
                            start = setting.start;
                        }

                        console.log(_output_yahoo_download_link(
                            start.getMonth().toString(), start.getDate().toString(), start.getFullYear().toString(),
                            setting.end.getMonth().toString(), setting.end.getDate().toString(), setting.end.getFullYear().toString(),
                            setting.market, cells[0], cells[1], period));
                    }

                }
            }
        });
    } else if (action === 2) {

        // console.log(_output_dropdown_list(setting.market, cells[1], cells[2], cells[3]));
        var lines = myUtil.readlinesSync(filename);
        for (var i = 0; i < lines.length; i++) {
            if (i === 0) {
                setting = etlUtil.parse_setting(lines[i]);
            } else {
                cells = lines[i].split(',');
                if (cells.length === 4) {
                    dropdownList.push(_output_dropdown_list(setting.market, cells[1], cells[2], cells[3]));
                }
            }
        }

        dropdownList.sort(function(obj1, obj2) {
            if (obj1.n > obj2.n) {
                return 1;
            } else if (obj1.n < obj2.n) {
                return -1;
            }
            return 0;
        });

        fs.writeFile("{0}_.js".format(setting.market), JSON.stringify(dropdownList), {
            "encoding": 'utf-8'
        }, function(err) {
            if (err) {
                throw err;
            }
            console.log("{0}_.js saved".format(setting.market));
        });
    }
}

main();


function _output_dropdown_list(market, code, name, sector) {
    // return '"{1}": {"n":"{2}", "s": "{3}"},'.format(market, code, name, sector);
    return {
        "c": code,
        "n": name,
        "s": sector
    }
}

function _output_stooq_download_link(start, end, market, symbol, code, type, ignoreDateRange) {
    type = etlUtil.encode_period(type);
    if (ignoreDateRange) {
        return 'curl -o ./d/{4}_{5}_{3}.csv "http://stooq.com/q/d/l/?s={2}&i={3}"'.format(start, end, symbol, type, market, code);
    }
    return 'curl -o ./d/{4}_{5}_{3}.csv "http://stooq.com/q/d/l/?s={2}&d1={0}&d2={1}&i={3}"'.format(start, end, symbol, type, market, code);
}

function _output_yahoo_download_link(a, b, c, d, e, f, market, symbol, code, type) {
    type = etlUtil.encode_period(type);
    return 'curl -o ./d/{8}_{9}_{7}.csv "http://real-chart.finance.yahoo.com/table.csv?s={6}&a={0}&b={1}&c={2}&d={3}&e={4}&f={5}&g={7}&ignore=.csv"'.format(a, b, c, d, e, f, symbol, type, market, code);
}

function _get_mid_term_date(reference, offsetYear) {
    return new Date(reference.getFullYear() + offsetYear, reference.getMonth(), reference.getDate());
}
