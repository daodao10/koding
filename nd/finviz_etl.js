/**
 * extract data from finviz.com
 **/
const RegPaging = /<td width="140" align="left" valign="bottom" class="count-text"><b>Total: <\/b>(\d+) #\d+<\/td>/g;
const RegRows = /<a href="quote\.ashx.*class="tab-link">(.+?)<\/a><\/td><td height="10" align="left" class="body-table-nw">(.+?)<\/td><td height="10" align="left" class="body-table-nw">(.+?)<\/td><td height="10" align="left" class="body-table-nw">(.+?)<\/td>(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)(<td height="10" align="right" class="body-table-nw"><span style="color:#[abcdef0-9]{6};">([-.,0-9%]+)<\/span><\/td>|<td height="10" align="right" class="body-table-nw">([-.,0-9%]+)<\/td>)/g;
const PageSize = 20;

var fs = require('fs'),
    Promise = require('promise'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil');

function get(startRowIndex) {
    return new Promise(function(resolve, reject) {
        myUtil.get({
            host: 'finviz.com',
            path: '/screener.ashx?v=150&f=fa_eps5years_pos,ind_stocksonly,sh_avgvol_o300,sh_price_o5&o=ticker&r={0}'.format(startRowIndex),
            // path: '/screener.ashx?v=151&f=ind_stocksonly,sh_avgvol_o100,sh_price_o1&ft=4&o=ticker&r={0}'.format(startRowIndex),
            headers: {
                "Cookie": "customTable=1,2,3,4,7,9,10,11,13,19,32,33,52,53,54,59,66,67;"
            }
        }, function(data, statusCode) {

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
    if (m && m.length === 47) {
        return [m[1], m[2], m[3], m[4],
            m[6] ? myUtil.toNumber(m[6]) : myUtil.toNumber(m[7]),
            m[9] ? myUtil.toNumber(m[9]) : myUtil.toNumber(m[10]),
            m[12] ? myUtil.toNumber(m[12]) : myUtil.toNumber(m[13]),
            m[15] ? myUtil.toNumber(m[15]) : myUtil.toNumber(m[16]),
            m[18] ? myUtil.toNumber(m[18]) : myUtil.toNumber(m[19]),
            m[21] ? myUtil.toNumber(m[21]) : myUtil.toNumber(m[22]),
            m[24] ? myUtil.toNumber(m[24]) : myUtil.toNumber(m[25]),
            m[27] ? myUtil.toNumber(m[27]) : myUtil.toNumber(m[28]),
            m[30] ? myUtil.toNumber(m[30]) : myUtil.toNumber(m[31]),
            m[33] ? myUtil.toNumber(m[33]) : myUtil.toNumber(m[34]),
            m[36] ? myUtil.toNumber(m[36]) : myUtil.toNumber(m[37]),
            m[39] ? myUtil.toNumber(m[39]) : myUtil.toNumber(m[40]),
            m[42] ? myUtil.toNumber(m[42]) : myUtil.toNumber(m[43]),
            m[45] ? myUtil.toNumber(m[45]) : myUtil.toNumber(m[46])
        ];
    }
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

function header() {
    return 'Ticker,Company,Sector,Industry,P/E,PEG,P/S,P/B,P/FCF,EPS past 5Y,ROA,ROE,SMA20,SMA50,SMA200,RSI,Change,Volume';
}

function to_csv(arr) {
    return arr.map(function(element) {
        if (element[1].indexOf(',') >= 0) {
            //element[1] = "\"" + element[1] +  "\"";// keep , to excel
            element[1] = element[1].replace(/,/g, ''); // remove , to coding
        }
        if (element[3].indexOf(',') >= 0) {
            element[3] = element[3].replace(/,/g, ' -'); // remove , to coding
        }
        return element.join(',');
    });
}

function save(data) {
    fs.writeFile("test.csv", data, function(err) {
        if (err) {
            throw err;
        }
        console.log('done');
    });
}

get(1).done(function(data) {
    // get paging info
    var indices = [];
    var paging = parse(RegPaging, data, pagingDataFunc);
    for (var i = 1; i <= paging[0]; i += PageSize) {
        indices.push(i)
    }
    console.log('total page:', indices.length);

    var result = [header()];
    Promise.all(indices.map(get)).then(function(contents) {
        contents.forEach(function(content, index) {
            var rows = parse(RegRows, content, rowDataFunc);
            if (rows[0]) {
                rows = to_csv(rows);
                Array.prototype.push.apply(result, rows);
            } else {
                console.log('page %d, parse failed', (index + 1).toString());
            }
        });
    }, function(error) {
        console.error('page %d: get failed, error: %s', error.page, error.error);
    }).then(function() {
        save(result.join('\n') + "\n");
    }).catch(function(error) {
        console.error(error);
    });
});
