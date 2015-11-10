var Widht = 640,
    Height = 360;

var casper = require("casper").create({
        viewportSize: {
            width: Widht,
            height: Height
        }
    }),
    url = casper.cli.args[0],
    symbol = casper.cli.args[1],
    saveDir = "201510/",
    output = saveDir + symbol + ".png";

var test = false;
if (test) {
    // dynamic folder
    saveDir = url.replace(/[^a-zA-Z0-9]/gi, '-').replace(/^https?-+/, '');
    output = saveDir + '/' + Widht + '-' + Height + ".png";
}

casper.start(url, function() {
    this.echo('snapshot: ' + symbol);
});

//give some time for the page to load
casper.wait(5000, function() {

    //capture snaps a defined selection of the page
    this.capture(output, {
        top: 3,
        left: 27,
        width: Widht - 30,
        height: Height - 53
    });

});

casper.run(function() {
    this.echo('Finished captures for ' + url).exit();
});