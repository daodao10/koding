/**
 * refer to:
 * http://christiankvalheim.com/post/an_introduction_to_1_4_and_2_6/
 * https://github.com/mongodb/node-mongodb-native/blob/master/docs/articles/MongoClient.md#mongoclientconnect
 */

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
                if (callback) return callback(err);
                return console.dir(err);
            }

            (query.s ? collection.find(query.q, query.f || {}, query.o || {}).sort(query.s) : collection.find(query.q, query.f || {}, query.o || {})).toArray(function(err, documents) {
                // console.log("Found the following records");
                // console.log(documents.length);
                // console.dir(documents);

                db.close();

                if (err) {
                    if (callback) return callback(err);
                    return console.dir(err);
                }

                if (callback) {
                    callback(null, documents);
                }
            });

        });
    });
};

MyMongo.prototype.aggregate = function(collectionName, query, callback) {

    // console.log(query);

    this.connect(function(db) {
        var docs = [],
            counter = 0;

        var cursor = db.collection(collectionName).aggregate(query, {
            "cursor": {
                "batchSize": 25
            }
        });

        cursor.on('data', function(data) {
            docs.push(data);
            counter++;
        });

        cursor.on('end', function() {
            console.log("Iterated " + counter + " times");
            db.close();
            callback(null, docs);
        });
    });
};

MyMongo.prototype.insert = function(collectionName, documents, callback) {
    this.connect(function(db) {
        var collection = db.collection(collectionName);
        collection.insert(documents, function(err, result) {
            db.close();

            if (err) {
                if (callback) return callback(err);
                return console.dir(err);
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
                if (callback) return callback(err);
                return console.dir(err);
            }

            if (callback) {
                callback(null, result);
            }
        });
    });
};

MyMongo.prototype.upsertBatch = function(collectionName, docs, callback) {
    this.connect(function(db) {
        var collection = db.collection(collectionName);

        var bulk = collection.initializeUnorderedBulkOp();

        docs.forEach(function(element) {
            bulk.find({
                _id: element._id
            }).upsert().replaceOne({
                $set: element
            });
        });

        bulk.execute(function(err, result) {
            db.close();

            if (err) {
                if (callback) return callback(err);
                return console.dir(err);
            }

            if (callback) {
                callback(null, {
                    inserted: result.nInserted,
                    upserted: result.nUpserted
                });
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
                    if (callback) return callback(err);
                    return console.dir(err);
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
