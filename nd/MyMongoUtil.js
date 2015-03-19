// https://github.com/mongodb/node-mongodb-native/blob/master/docs/articles/MongoClient.md#mongoclientconnect
var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');

/*
parameters:
query = {
    q: query,
    f: fields,
    u: update,
    s: sorting,
    o: options
}
*/

function MyMongo(url) {
    this.url = url;

    this.connect = function(dbAction) {
        // console.log(this.url);
        // Use connect method to connect to the Server
        MongoClient.connect(this.url, function(err, db) {
            if (err) throw err;

            // assert.equal(null, err);
            // console.log("Connected correctly to server");

            dbAction(db);
        });
    };
}

MyMongo.prototype.find = function(collectionName, query, callback) {
    this.connect(function(db) {
        db.collection(collectionName, function(err, collection) {

            if (err) {
                db.close();
                // console.error(err);
                return callback(err);
            }

            (query.s ? collection.find(query.q, query.f || {}, query.o || {}).sort(query.s) : collection.find(query.q, query.f || {}, query.o || {})).toArray(function(err, documents) {
                // console.log("Found the following records");
                // console.log(documents.length);
                // console.dir(documents);

                db.close();

                if (err) {
                    return callback(err);
                }

                if (callback) {
                    callback(null, documents);
                }
            });

        });
    });
};

MyMongo.prototype.insert = function(collectionName, documents, callback) {
    this.connect(function(db) {
        var collection = db.collection(collectionName);
        collection.insert(documents, function(err, result) {
            db.close();

            if (err) {
                // console.error(err);
                return callback(err);
            }

            if (callback) {
                callback(null, result);
            }
        });
    });
};

MyMongo.prototype.update = function(collectionName, query, callback) {
    this.connect(function(db) {
        var collection = db.collection(collectionName);
        collection.update(query.q, query.u, query.o || {}, function(err, result) {
            db.close();

            if (err) {
                // console.error(err);
                return callback(err);
            }

            if (callback) {
                callback(null, result);
            }
        });
    });
};

MyMongo.prototype.nextSequence = function(name, callback) {
    this.connect(function(db) {
        db.collection("counters").findAndModify({
                _id: name
            }, null, {
                $inc: {
                    seq: 1
                }
            }, {
                "new": true,
                "upsert": true
            },
            function(err, docs) {
                db.close();

                if (err) {
                    return callback(err);
                }

                if (callback) {
                    callback(null, docs.seq);
                }
            });
    });
};

MyMongo.prototype.updateSequence = function(name, value, callback) {
    this.update("counters", {
        q: {
            _id: name
        },
        u: {
            $set: {
                seq: value
            }
        },
        o: {
            "upsert": true,
            "multi": false
        }
    }, callback);
};

module.exports = MyMongo;
