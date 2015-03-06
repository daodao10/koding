/**
 * handle duplicated em data
 */

load("../DuplicatedHandler.js")

var h = new DuplicatedHandler({
    dn: "test",
    m: {
        d: "20150306"
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
// h.rm(true);
// h.update({
//     d: "20150225"
// });
