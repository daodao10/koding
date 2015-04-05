var QuoteEtl = require('./jj_etl');


function ESQuoteEtl() {
    this.getResolve = function(pathArgs, data) {
        eval(data.toString());

        if (pathArgs.plain) {
            return this.parsePlain(pathArgs, apidata.pages);
        } else {
            return this.parseData(pathArgs, apidata.content);
        }

    };
}
QuoteEtl.extend(ESQuoteEtl, {
    Host: 'fund.eastmoney.com',
    PathFormat: "/f10/F10DataApi.aspx?type=lsjz&code={0}&page={1}&per=100",
    DataReg: /<tr><td>([0-9-]+)<\/td><td class='tor bold'>[0-9.]+<\/td><td class='tor bold'>([0-9.]+)<\/td>/g,
    DestFolder: "../../daodao10.github.io/chart/jjjz_es/"
});　


function main() {
    var etl = new ESQuoteEtl();
    // console.log(ESQuoteEtl.constructor);
    // console.log(etl.constructor);
    // console.log(etl.constructor === ESQuoteEtl.prototype.constructor);
    // console.log(etl.__proto__.constructor === ESQuoteEtl.prototype.constructor);
    // var x = new QuoteEtl();
    // console.log(QuoteEtl.prototype.constructor);
    // console.log(x.constructor);

    ['510510'].forEach(function(symbol) {
        etl.read(symbol).done(function(d) {
            console.log(d.symbol);
            etl.write_js(d);
        });
    });
}