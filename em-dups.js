var action = 1; // 1 -- display record, 2 -- remove
main(action, {
    gid: {
        d: "$d",
        s: "$s"
    }
});

function main(action, options) {
    /*
	options:{
		m: $match
		s: $sort,
		gid: $group._id,

	}
	*/

    if (options && options.gid) {
        var x = db.test.aggregate([{
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
        }]);

        if (x && x.result) {
            if (x.result.length === 0) {
                print("don't any have duplicated record!");
                return;
            }
            print("found " + x.result.length + "record(s)");
            x.result.forEach(function(doc) {
                if (action === 2) {
                    rm(doc.ids);
                } else {
                    display(doc);
                }
            });
        };
    } else {
        print("please set the options");
    }
}

function display(doc) {
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
}

// db.text.ensureIndex({"d": 1, "s": 1}, {unique: true, dropDups: true})
function rm(ids) {
    for (var i in ids) {
        if (i === "0") {
            continue;
        }
        db.test.remove({
            _id: ids[i]
        });
    }
}
