// get data from shanghai exchange
// 1) market info
// 2) symbols

var fs = require('fs'),
    myUtil = require('../nd/MyUtil'),
    anounymous = require('../nd/ProtoUtil'),
    his = require('./sse_his');


// 1)
// var url ="http://query.sse.com.cn/marketdata/tradedata/queryMonthlyTrade.do?jsonCallBack=jsonpCallback72267082&prodType=9&inYear=2014&_=1414322768255";
// myUtil.get(url, function(data, status){
//  console.log(data);
//  console.log(status);
// });



// 2)
function getMarketInfo() {
    var options = {
            host: 'query.sse.com.cn',
            port: 80,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36',
                'Referer': 'http://www.sse.com.cn/market/dealingdata/overview/stock/abshare/absharedealmonth_index.shtml?YEAR=2014&prodType=9&sytle=1'
            },
            // debug: true,
            jsonp: true
        },
        urlFormat = '/marketdata/tradedata/queryMonthlyTrade.do?jsonCallBack=jsonpCallbackMV&prodType=9&inYear={0}&_=1414322768255',
        start = 2014,
        till = 2015,
        processed = 0,
        rows = [],
        y;

    var processYearlyMV = function(data) {
        // console.log('hello');
        var item,
            result = [];
        data = data.result;
        for (var i = 0; i < data.length; i++) {
            item = data[i];
            result.push({
                "month": item.mmaxTrAmtDate.substring(0, 4) + item.mmaxTrAmtDate.substring(5, 7),
                "t_trans": parseFloat(item.mtotalTx), // 总成交笔数
                "t_volume": (new Number(item.mtotalVol)).valueOf(), //总成交量
                "t_amount": parseFloat(item.mtotalAmt), // 总成交额
                "PE": parseFloat(item.mprofitRate),
                "m_value": parseFloat(item.mmarketValue), // 总市值
                "m_value_current": parseFloat(item.mnegotiableValue) // 流通市值
            });
        }

        rows = rows.concat(result);
        processed++;

        if (processed == till - start) {
            his.push(rows.pop());
            extract2File();
            // console.log(rows);
        }
    };

    for (y = start; y < till; y++) {
        // console.log(urlFormat.format(y));
        options.path = urlFormat.format(y);
        myUtil.get(options, processYearlyMV);
    }


    var extract2File = function() {

        var x = [],
            y = [],
            item;

        y[0] = [];
        y[1] = [];
        y[2] = [];
        y[3] = [];
        y[4] = [];

        for (var i = 0; i < his.length; i++) {
            item = his[i];
            x.push(item.month);
            y[0].push(item.t_volume);
            y[1].push(item.t_trans);
            y[2].push(item.t_amount);
            y[3].push(item.PE);
            y[4].push(item.m_value_current);
        }

        var d = {
            "x": x,
            "y0": y[0],
            "y1": y[1],
            "y2": y[2],
            "y3": y[3],
            "y4": y[4]
        }

        fs.writeFileSync('sse1.js', JSON.stringify(d), {
            'encoding': 'utf-8'
        });
    };
}

function getAllSymbols() {

    var filename = 'sse-symbol.js';

    function sync(func) {
        var options = {
            host: 'www.sse.com.cn',
            port: 80,
            path: '/js/common/ssesuggestdataAll.js',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36',
                'Referer': 'http://www.sse.com.cn/market/dealingdata/overview/stock/abshare/absharedealmonth_index.shtml?YEAR=2014&prodType=9&sytle=1'
            }
        };
        myUtil.get(options, function(data) {
            fs.writeFileSync(filename, data, {
                'encoding': 'utf-8'
            });
            fs.appendFileSync(filename, 'module.exports = get_alldata;', {
                'encoding': 'utf-8'
            });
            coreProcess();

            func();

        });
    }

    function coreProcess() {
        var s = require('./' + filename.replace('.js', ''))();
        // console.log(s);
        var symbols = s.filter(function(item) {
            if (item.val.startsWith('6'))
                return item;
        }).map(function(item) {
            return "{0},{1}-{2}".format(item.val, item.val3.replace('*', ''), item.val2);
        });

        return symbols;
    }

    function save() {
        var symbols = coreProcess();
        fs.writeFileSync('sse-symbol.txt', symbols.join("\n"), {
            'encoding': 'utf-8'
        });
    }

    // sync with sse
    sync(save);

}


// getAllSymbols();

getMarketInfo();
