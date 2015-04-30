/**
 * extract data from finviz.com
**/
const RegPaging = /<td width="140" align="left" valign="bottom" class="count-text"><b>Total: <\/b>(\d+) #\d+<\/td>/g;
const RegRows = /<a href="quote\.ashx.*class="tab-link">(.+?)<\/a><\/td><td height="10" align="left" class="body-table-nw">(.+?)<\/td><td height="10" align="left" class="body-table-nw">(.+?)<\/td>(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)/g;
const PageSize = 20;

var fs = require('fs'),
    Promise = require('promise'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil');

function get(startRowIndex) {
    return new Promise(function(resolve, reject) {
        myUtil.get({
            host: 'finviz.com',
            path: '/screener.ashx?v=150&f=fa_eps5years_pos,ind_stocksonly,sh_avgvol_o300,sh_price_o5&ft=4&o=ticker&r={0}'.format(startRowIndex),
            headers: {
                "Cookie": "customTable=1,2,3,7,9,10,11,13,19,32,33,52,53,54,59,66,67;"
            }
        }, function(data, statusCode) {

            if (statusCode !== 200) {
                console.error('error occurred: ', statusCode);
                reject(statusCode);
            }

            resolve(data.toString());
        });
    });
}

function rowDataFunc(m) {
    if (m && m.length === 46) {
        return [m[1], m[2], m[3],
            m[5] ? toNum(m[5]) : toNum(m[6]),
            m[8] ? toNum(m[8]) : toNum(m[9]),
            m[11] ? toNum(m[11]) : toNum(m[12]),
            m[14] ? toNum(m[14]) : toNum(m[15]),
            m[17] ? toNum(m[17]) : toNum(m[18]),
            m[20] ? toNum(m[20]) : toNum(m[21]),
            m[23] ? toNum(m[23]) : toNum(m[24]),
            m[26] ? toNum(m[26]) : toNum(m[27]),
            m[29] ? toNum(m[29]) : toNum(m[30]),
            m[32] ? toNum(m[32]) : toNum(m[33]),
            m[35] ? toNum(m[35]) : toNum(m[36]),
            m[38] ? toNum(m[38]) : toNum(m[39]),
            m[41] ? toNum(m[41]) : toNum(m[42]),
            m[44] ? toNum(m[44]) : toNum(m[45])
        ];
    }
    return null;
}

function pagingDataFunc(m) {
    if (m && m.length === 2) {
        return toNum(m[1]);
    }
    return 0;
}

function parse(reg, input, dataFunc) {
    // Ticker,Company,Sector,P/E,PEG,P/S,P/B,P/FCF,EPS past 5Y,ROA,ROE,SMA20,SMA50,SMA200,RSI,Change,Volume
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

function toNum(str) {
    if (str === "-") {
        return 0;
    } else {
        return Number(str.replace(/[,%]/g, ''));
    }
}

function save(data) {
    fs.writeFile("test.csv", data, function(err) {
        if (err) {
            throw err;
        }
        console.log('done');
    });
}

function append(data) {
    fs.appendFile('test.csv', data, function(err) {
        if (err) {
            throw err;
        }
        console.log('done');
    });
}

function header() {
    return 'Ticker,Company,Sector,P/E,PEG,P/S,P/B,P/FCF,EPS past 5Y,ROA,ROE,SMA20,SMA50,SMA200,RSI,Change,Volume';
}

function to_csv(arr) {
    return arr.map(function(element) {
        if (element[1].indexOf(',') >= 0) {
            //element[1] = "\"" + element[1] +  "\"";// keep , to excel
            element[1] = element[1].replace(',', '');// remove , to coding
        }
        return element.join(',');
    });
}

function process(data, first) {
    var result = parse(RegRows, data, rowDataFunc);
    if (result[0]) {
        if (first) {
            result = [header()].concat(to_csv(result));
            save(result.join('\n') + "\n");
        } else {
            append(to_csv(result).join('\n') + "\n");
        }
    } else {
        console.log('empty');
    }
}

get(1).done(function(data) {
    // get paging info
    var indices = [];
    var paging = parse(RegPaging, data, pagingDataFunc);
    for (var i = 1 + PageSize; i <= paging[0]; i += PageSize) {
        indices.push(i)
    }
    // console.log('total page:', indices.length);

    // process data
    console.log(1);
    process(data, true);

    indices.forEach(function(element) {
        console.log(element);
        get(element).done(process);
    });

});
