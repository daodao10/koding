var symbols = require('./cn-symbol.json'),
    anounymous = require('../../nd/MyUtil');

Object.getOwnPropertyNames(symbols).forEach(function(key) {
    var name = symbols[key];
    if (name.indexOf(' ') > 0) {
        console.log('casperjs c1.js "http://localhost:3000/t4/cn/%s/%s" %s%s',
            key,
            name,
            key.startsWith("0") || key.startsWith("3") ? "sz" : "sh",
            key);
    }
});