/**
* handle duplicated daily data
*/

load("./DuplicatedHandler.js")

var h = new DuplicatedHandler({
    dn: "day",
    m: {
        date: "20150107"
    },
    s: {
        date: 1
    },
    gid: {
        date: "$date",
        code: "$code"
    }
});

// h.display();
h.rm();
