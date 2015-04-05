var QuoteEtl = require('./jj_etl');


function JRJQuoteEtl() {
    this.wrapPathArgs = function(symbol) {
        return {
            s: symbol,
            i: new Date().getFullYear(),
            plain: true
        };
    };
    this.parsePlain = function(pathArgs, content) {
        var result = [],
            m;

        result.push({
            s: pathArgs.s,
            i: pathArgs.i
        });

        while ((m = this.settings.PlainReg.exec(content))) {
            if (m.index === m.lastIndex) {
                m.lastIndex++;
            }
            result.push({
                s: pathArgs.s,
                i: m[1]
            });
        }

        return result;
    };
}
QuoteEtl.extend(JRJQuoteEtl, {
    Host: 'fund.jrj.com.cn',
    PathFormat: "/archives,{0},jjjz,{1}.shtml",
    DataReg: /<td class="jrj-tc">([0-9-]+)<\/td>\s+<td class="jrj-tr">[0-9.]+<\/td>\s+<td class="jrj-tr">([0-9.]+)<\/td>/g,
    PlainReg: /<option value=".*"  >(\d{4})年<\/option>/g,
    DestFolder: "../../daodao10.github.io/chart/jjjz/"
});


function main() {
    var etl = new JRJQuoteEtl();
    ['510510', '050026', '159915', '510050', '510660'].forEach(function(symbol) {
        etl.read(symbol).done(function(d) {
            console.log(d.symbol);
            etl.write_js(d);
        });
    });
}