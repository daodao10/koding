//
//

main(1, {
    dn: "test",
    s: {
        date: 1
    },
    gid: {
        d: "$d",
        s: "$s"
    }
});

function main(action, options) {
    /*
    action: 1 -- display record, 2 -- remove
    options: {
        dn: DB_Name,
        m: $match
        s: $sort,
        gid: $group._id,

    }*/


    var display = function(doc) {
        var result = [];
        for (var i in doc) {
            if (typeof doc[i] === "object") {
                if (Array.isArray(doc[i])) {
                    result.push(i + ":[" + doc[i] + "]");
                } else {
                    for (var j in doc[i]) {
                        result.push(j + ":" + doc[i][j]);
                    }
                }
            } else {
                result.push(i + ":" + doc[i]);
            }
        }
        print(result.join(','));
    };

    // db.text.ensureIndex({"d": 1, "s": 1}, {unique: true, dropDups: true})
    var rm = function(ids) {
        for (var i in ids) {
            if (i === "0") {
                continue;
            }
            db[options.dn].remove({
                _id: ids[i]
            });
        }
    };


    if (options && options.gid) {
        var x = db[options.dn].aggregate([{
            $match: options.m || {}
        }, {
            $sort: options.s || {
                _id: 1
            }
        }, {
            $group: {
                _id: options.gid,
                c: {
                    $sum: 1
                },
                'ids': {
                    $push: "$_id"
                }
            }
        }, {
            $match: {
                "c": {
                    $gt: 1
                }
            }
        }, {
            $sort: {
                _id: 1
            }
        }]);

        // print help
        // x.help();
        // x.shellPrint();

        if (x) {
            // print("found " + x.itcount() + " record(s)");
            x.forEach(function(doc) {
                if (action === 2) {
                    rm(doc.ids);
                } else {
                    display(doc);
                }
            });
        } else {
            print("don't any have duplicated record!");
        }
    } else {
        print("please set the options");
    }

}
