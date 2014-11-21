var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');

function MyMongo(url) {
    this.url = url;
}

MyMongo.prototype.find = function(collectionName, query, callback) {
    // Use connect method to connect to the Server
    MongoClient.connect(this.url, function(err, db) {
        if (err) throw err;

        // assert.equal(null, err);
        // console.log("Connected correctly to server");

        db.collection(collectionName, function(err, collection) {

            (query.s ? collection.find(query.q).sort(query.s) : collection.find(query.q)).toArray(function(err, documents) {
                // console.log("Found the following records");
                // console.log(documents.length);
                // console.dir(documents);

                if (callback) {
                    callback(documents);
                }

                db.close();
            });

        });
    });
};

MyMongo.prototype.insert = function(collectionName, documents, callback) {
    MongoClient.connect(this.url, function(err, db) {
        if (err) throw err;

        var collection = db.collection(collectionName);
        collection.insert(documents, function(err, result) {
            if (err) {
                console.log(err);
            };
            if (callback) {
                callback(result);
            }

            db.close();
        });

    });
};

MyMongo.prototype.getNextSequence = function(name, callback) {
    MongoClient.connect(this.url, function(err, db) {
        if (err) throw err;

        db.collection("counters").findAndModify({
                _id: name
            },
            null, {
                $inc: {
                    seq: 1
                }
            }, {
                "new": true,
                "upsert": true
            },
            function(err, docs) {                
                if (callback) {
                    callback(docs.seq);
                }
                db.close();
            });
    });
};

module.exports = MyMongo;
