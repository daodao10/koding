/**
* handle duplicated em data
*/

load("./DuplicatedHandler.js")

DuplicatedHandler(1, {
    dn: "test",
    m: {
        d: "20141231"
    },
    s: {
        _id: 1
    },
    gid: {
        date: "$d",
        code: "$s"
    }
});
