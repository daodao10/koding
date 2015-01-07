/**
 * handle duplicated em data
 */

load("./DuplicatedHandler.js")

var h = new DuplicatedHandler({
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

h.display();
// h.rm();
