/**
* handle duplicated daily data
*/

load("./DuplicatedHandler.js")

DuplicatedHandler(2, {
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
