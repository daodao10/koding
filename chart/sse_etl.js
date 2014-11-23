// get data from shanghai exchange

var myUtil = require('../nd/MyUtil'),
    util = require('util');

// 1)
// var url ="http://query.sse.com.cn/marketdata/tradedata/queryMonthlyTrade.do?jsonCallBack=jsonpCallback72267082&prodType=9&inYear=2014&_=1414322768255";
// myUtil.get(url, function(data, status){
// 	console.log(data);
// 	console.log(status);
// });



// 2)
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
    urlFormat = '/marketdata/tradedata/queryMonthlyTrade.do?jsonCallBack=jsonpCallbackMV&prodType=9&inYear=%s&_=1414322768255',
    start = 1990,
    till = 1999,
    processed = 0,
    rows = [],
    y;

for (y = start; y < till; y++) {
    options.path = util.format(urlFormat, y);
    myUtil.get(options, processYearlyMV);
}

function processYearlyMV(data) {
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
        console.log(rows);
    }
}