var page = require('webpage').create(),
    system = require('system'),
    anonymous = require('./util'),
    address,
    output;


if (system.args.length === 1) {
    console.log('Usage: finviz.js [date]');
    phantom.exit();
}

address = "http://finviz.com/"
if (system.args.length === 2) {
    output = "{0}/finviz.png".format(system.args[1]);
} else {
    output = "finviz.png";
}

page.open(address, function(status) {
    if (status !== 'success') {
        console.log('FAIL to load the address');
    } else {
        page.clipRect = {
            top: 150,
            left: 0,
            width: 1000,
            height: 220
        };
        page.render(output)
        console.log("done");
    }
    phantom.exit();
});