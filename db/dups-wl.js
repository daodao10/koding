/*
* handle duplicated watchlist data
*/


load("./DuplicatedHandler.js")

var h = new DuplicatedHandler({
    dn: "wl",
    m: {
    },
    s: {
        _id: -1
    },
    gid: {
        s: "$s"
    }
});

// h.display();
h.rm(true);
