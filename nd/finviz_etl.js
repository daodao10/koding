/**
 * extract data from finviz.com
 **/
const RegPaging = /<td width="140" align="left" valign="bottom" class="count-text"><b>Total: <\/b>(\d+) #\d+<\/td>/g;
const RegRows = /<a href="quote\.ashx\?t=[A-Z-]*&ty=c&p=d&b=1" class="screener-link"><span style="color:#[a-f0-9]{6};">([0-9-%.]*)<\/span><\/a>|<a href="quote\.ashx\?t=[A-Z-]*&ty=c&p=d&b=1" class="screener-link(?:-primary)?">(.*?)<\/a>/g;
const PageSize = 20;

var fs = require('fs'),
    //Promise = require('promise'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil'),
    cu = require('./CounterUtil');

var counterUtil = new cu.CounterUtil('counterUS');

var Settings = {
    // UrlPath: '/screener.ashx?v=150&f=fa_eps5years_pos,ind_stocksonly,sh_avgvol_o500,sh_price_o5&o=ticker&r={0}',
    // FilePath: './-hid/test_us.csv',
    // UrlPath: '/screener.ashx?v=151&f=geo_chinahongkong,ind_stocksonly&ft=4&o=ticker&r={0}',
    // FilePath: './-hid/test_cn.csv',

    // update name of 中概股
    // UrlPath:'/screener.ashx?v=151&f=ind_stocksonly&ft=4&o=ticker&r={0}&t=AMC,APWC,AUO,CHT,CYD,GIGM,GSOL,HIMX,IMOS,LEDS,NVFY,OIIM,SINO,SPIL,SYUT,UMC',
    // FilePath:'./-hid/patch_cn.csv',
    PatchFile: './-hid/_patch.csv'
};

function get(startRowIndex) {
    return new Promise(function (resolve, reject) {
        myUtil.request({
            host: 'finviz.com',
            path: Settings.UrlPath.format(startRowIndex),
            headers: {
                "Cookie": "customTable=1,2,3,4,7,9,10,11,13,19,32,33,52,53,54,59,66,67,24;"
            }
        }, function (data, statusCode) {

            if (statusCode !== 200) {
                console.error('error occurred: ', statusCode);
                reject({
                    page: startRowIndex,
                    error: statusCode
                });
            }

            resolve(data);
        });
    });
}

function rowDataFunc(m) {
    if (m && m.length === 3)
        if (m[1])
            return m[1];
        else if (m[2])
            return m[2];

    return null;
}

function pagingDataFunc(m) {
    if (m && m.length === 2) {
        return myUtil.toNumber(m[1]);
    }
    return 0;
}

function parse(reg, input, dataFunc) {
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

function csv_header() {
    return 'Ticker,Company,Sector,Industry,P/E,PEG,P/S,P/B,P/FCF,EPS past 5Y,ROA,ROE,SMA20,SMA50,SMA200,RSI,Change,Volume,Shares Outstanding';
}
function to_csv(arr) {
    return arr.map(function (element) {
        if (element[1].indexOf(',') >= 0) {
            //element[1] = "\"" + element[1] +  "\"";// keep , to excel
            element[1] = element[1].replace(/,/g, ''); // remove the comma from 'Company'
        }
        if (element[3].indexOf(',') >= 0) {
            element[3] = element[3].replace(/,/g, ' -'); // replace the comma in 'Industry' with the dash
        }
        if (element[17].indexOf(',') >= 0) {
            element[17] = element[17].replace(/,/g, ''); // remove the comma from 'Volume'
        }
        if (element[18].indexOf(',') >= 0) {
            element[18] = element[18].replace(/,/g, ''); // remove the comma from 'Shares Outstanding'
        }
        return element.join(',');
    });
}

function save(fileName, data) {
    fs.writeFile(fileName, data, function (err) {
        if (err) {
            throw err;
        }
        console.log('done');
    });
}

function etl() {
    get(1).then(function (data) {
        // get paging info
        var indices = [];
        var paging = parse(RegPaging, data, pagingDataFunc);
        for (var i = 1; i <= paging[0]; i += PageSize) {
            indices.push(i)
        }
        console.log('total page:', indices.length);

        var result = [csv_header()];
        Promise.all(indices.map(get)).then(function (contents) {
            contents.forEach(function (content, index) {
                var items = parse(RegRows, content, rowDataFunc),
                    rows = [],
                    j;
                for (var i = 0; i < items.length; i++) {
                    if (i % 19 == 0) {
                        j = i / 19;
                        rows[j] = [];
                    }
                    rows[j].push(items[i]);
                }
                if (rows[0]) {
                    Array.prototype.push.apply(result, to_csv(rows));
                } else {
                    console.log('page %d, parse failed', (index + 1).toString());
                }
            });
        }, function (error) {
            console.error('page %d: get failed, error: %s', error.page, error.error);
        }).then(function () {
            save(Settings.FilePath, result.join('\n') + "\n");
        }).catch(function (error) {
            console.error(error);
        });
    });
}

function storeToDB() {
    //TODO: refactor
    var toNumber = function (str) {
        if (str) {
            if (str.lastIndexOf('M') > 0)
                return myUtil.toNumber(str.replace('M', ''));
            else if (str.lastIndexOf('B') > 0)
                return myUtil.toNumber(str.replace('B', '')) * 1000;
        }
        return null;
    };

    (function (lines) {
        var docs = [];
        lines.forEach((line, index) => {
            if (index == 0) return;
            var cells = line.split(',');
            docs.push({
                _id: cells[0],
                code: cells[0],
                name: cells[1],
                sector: cells[2],
                industry: cells[3],
                mv: toNumber(cells[18])
            });
        });
        counterUtil.update(docs, 'insert qualitified docs');
    } (myUtil.readlinesSync(Settings.FilePath)));
}

function patch() {
    counterUtil.get({}, (err, docs) => {
        if (err) {
            console.error(err);
            return;
        }
        var lines = myUtil.readlinesSync(Settings.PatchFile);
        for (var i = 1; i < lines.length; i++) {
            var cells = lines[i].split(',');
            if (cells.length > 1) {
                // symbol | code, company
                var row = docs.findByProperty('_id', cells[0]);
                if (row) {
                    row["pinyin"] = cells[1];
                } else {
                    console.log(lines[i]);
                }
            }
        }

        counterUtil.update(docs, 'patch for counterUS');
    });
    var removed = ['COE', 'YIN', 'JFC', 'CNR', 'DANG', 'EJ', 'GRO', 'IDI', 'JMU', 'GHII'];
    // counterUtil.
}

/**
 * export us opt symbol list from db
 */
function us_opt_symbol_etl() {
    counterUtil.get({}, (err, docs) => {
        var x = [], jsFile;
        docs.forEach((doc) => {
            jsFile = '../../chart/us/' + doc.code + '_d.js';
            if (fs.existsSync(jsFile)) {
                if (doc.pinyin)
                    x.push(JSON.stringify({ "c": doc.code, "n": doc.name.toUpperCase() + " (" + doc.pinyin + ")", "s": doc.sector, "i": doc.industry, "mv": doc.mv }));
                else
                    x.push(JSON.stringify({ "c": doc.code, "n": doc.name.toUpperCase(), "s": doc.sector, "i": doc.industry, "mv": doc.mv }));
            } else {
                console.log('%s not found', doc.code);
            }
        });

        console.log(x.join(',\n'));
    });
}
function us_symbol_etl() {
    counterUtil.get({}, (err, docs) => {
        var x = [], jsFile;
        docs.forEach((doc) => {
            if (doc.pinyin)
                x.push("{0},{1},{2}({3}),{4},{5}".format(doc._id, doc.code, doc.name, doc.pinyin, doc.sector, doc.mv));
            else
                x.push("{0},{1},{2},{3},{4}".format(doc._id, doc.code, doc.name, doc.sector, doc.mv));
        });

        console.log(x.join('\n'));
    });
}
/**
 * remove redundant file from chart
 */
function us_symbol_remove(list) {
    if (!Array.isArray(list) || list.length < 1) return;

    counterUtil.get({}, (err, docs) => {
        var
            source = docs.map((doc) => {
                return doc.code
            });

        source.forEach((item) => {
            index = list.indexOf(item);
            if (index >= 0) {
                list.splice(index, 1);
            } else {
                console.log(item, 'not found');
            }
        });
        list.forEach((item) => {
            console.log('rm ' + item + '_d.js');
        });
    });
}

// etl();
// storeToDB();
// patch();

// us_opt_symbol_etl();
// us_symbol_etl();

// us_symbol_remove([]);
