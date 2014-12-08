var page = require('webpage').create(),
    system = require('system'),
    anonymous = require('./util'),
    symbol,
    address,
    output;


if (system.args.length === 1) {
    console.log('Usage: ct.js <symbol> [date]');
    phantom.exit();
}

symbol = system.args[1];
if (symbol.length !== 6) {
    console.log('wrong symbol [%s]', symbol);
};
address = "http://data.eastmoney.com/stockcomment/" + symbol + ".html"
if (system.args.length === 3) {
    output = "{0}/{1}.png".format(system.args[2], symbol);
} else {
    output = "{0}.png".format(symbol);
}

page.open(address, function(status) {
    if (status !== 'success') {
        console.log('FAIL to load the address');
    } else {
        page.clipRect = {
            top: 390,
            left: 30,
            width: 880,
            height: 650
        };
        page.render(output)
        console.log(symbol, "done");
    }
    phantom.exit();
});