// get data from shanghai exchange
// 1) market info
// 2) symbols

var fs = require('fs'),
    myUtil = require('../nd/MyUtil'),
    anounymous = require('../nd/ProtoUtil'),
    his = require('./sse_etl_his');


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
        start = 2015,
        till = 2016,
        processed = 0,
        rows = [],
        y;

    var processYearlyMV = function(data, statusCode) {
        if (statusCode !== undefined && statusCode !== 200) {
            console.error('error occurred:', statusCode);
            return;
        }
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

            // store historical data
            fs.writeFileSync('sse_etl_his.js', "module.exports = " + JSON.stringify(his, null, 2) + ";", {
                'encoding': 'utf-8'
            });

            // extract data
            extract2File();

            // console.log(rows);
        }
    };


    var extract2File = function() {
        var i = 0,
            vm = require('vm'),
            content = fs.readFileSync('../../daodao10.github.io/chart/world/^SSE_m.js');
        vm.runInThisContext(content);

        // data.reverse();
        if (data.length > his.length) {
            i = data.length - his.length;
            for (; i > 0; i--) {
                data.shift();
            }
        } else if (data.length !== his.length) {
            console.log('something wrong with index data & historical data');
            return;
        }

        var xAxis = [],
            yAxis = [],
            item;

        // initialize
        for (var i = 0; i < 6; i++) {
            yAxis[i] = [];
        }
        // fill
        for (i = 0; i < his.length; i++) {
            item = his[i];
            xAxis.push(item.month);
            yAxis[0].push(Number(data[i][1]));
            yAxis[1].push(item.t_volume);
            yAxis[2].push(item.t_trans);
            yAxis[3].push(item.t_amount);
            yAxis[4].push(item.PE);
            yAxis[5].push(item.m_value_current);
        }

        fs.writeFileSync('../../daodao10.github.io/chart/sse.js', "define(" + JSON.stringify({
            "x": xAxis,
            "y0": yAxis[0],
            "y1": yAxis[1],
            "y2": yAxis[2],
            "y3": yAxis[3],
            "y4": yAxis[4],
            "y5": yAxis[5]
        }, null, 2) + ");", {
            'encoding': 'utf-8'
        });
    };


    var dynamic = true;
    if (dynamic) {
        for (y = start; y < till; y++) {
            // console.log(urlFormat.format(y));
            options.path = urlFormat.format(y);
            myUtil.get(options, processYearlyMV);
        }
    } else {
        extract2File();
    }
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
            return "{0},{1}-{2}".format(item.val, item.val3.replace('*', '').toUpperCase(), item.val2);
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
