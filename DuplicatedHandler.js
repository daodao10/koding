var DuplicatedHandler = function(options) {
    /*
    options: {
        dn: DB_Name,
        m: $match
        s: $sort,
        gid: $group._id,

    }*/


    var _display = function(doc) {
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

    var _search = function(func) {
        var cursor = db[options.dn].aggregate([{
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
        // http://docs.mongodb.org/manual/reference/method/#js-query-cursor-methods
        // cursor.help();
        // cursor.shellPrint();

        if (cursor && cursor.objsLeftInBatch() > 0) {
            return cursor;
        } else {
            print("don't have any duplicated records!");
        }
    };

    var _execute = function(func) {
        var cursor = _search();
        if (cursor) {
            var ids = [];
            cursor.forEach(function(doc) {
                doc.ids.shift();
                if (doc.ids.length > 0) {
                    ids = ids.concat(doc.ids);
                }
            });

            if (ids.length && func) {
                func(ids);
            }
        }
    };

    if (options && options.gid) {
        return {
            display: function() {
                var cursor = _search();
                if (cursor) {
                    cursor.forEach(function(doc) {
                        _display(doc);
                    });
                }
            },
            rm: function(removed) {
                // db.text.ensureIndex({"d": 1, "s": 1}, {unique: true, dropDups: true})

                _execute(function(ids) {
                    if (removed) {
                        db[options.dn].remove({
                            _id: {
                                '$in': ids
                            }
                        });
                        print(ids.length, 'removed');
                    } else {
                        print('found', ids.length, 'records\nplease use rm(true) to hard remove');
                    }
                });
            },
            update: function(updateQuery) {
                _execute(function(ids) {
                    db[options.dn].update({
                        _id: {
                            '$in': ids
                        }
                    }, {
                        $set: updateQuery
                    }, {
                        multi: true
                    });
                    print(ids.length, 'update');
                });
            }
        };
    } else {
        print("please set the options");
    }

};