var MyMongo = require('../nd/MyMongoUtil'),
    anounymous = require('../nd/ProtoUtil'),
    config = require('../config.json'),
    myMongo = new MyMongo("{0}{1}".format(config.DbSettings.QuotesDbUri, 'quotes'));

function getDateRange() {
    var now = new Date(),
        yesterday = new Date(now.getTime() - (24 * 60 * 60000));
    // console.log(yesterday, now);

    // hard code:
    // return {
    //     start: "20150709",
    //     end: "20150811"
    // };

    return {
        start: yesterday.format('yyyyMMdd'),
        end: now.format('yyyyMMdd')
    };
}

function main() {

    var date = (process.argv.length == 3) ? {
        start: process.argv[2],
        end: process.argv[2]
    } : getDateRange();

    var query = [{
        $match: {
            $and: [{
                d: {
                    $gte: date.start
                }
            }, {
                d: {
                    $lte: date.end
                }
            }]
        }
    }, {
        $group: {
            _id: '$d',
            nhi: {
                $sum: '$nh'
            },
            nlo: {
                $sum: '$nl'
            }
        }
    }, {
        $match: {
            $and: [{
                nhi: {
                    $gt: 0
                }
            }, {
                nlo: {
                    $gt: 0
                }
            }]
        }
    }, {
        $sort: {
            _id: 1
        }
    }];

    myMongo.aggregate("nhnl", query, function(err, docs) {
        if (err) {
            console.error(err);
            return;
        }

        if (docs && docs.length > 0) {
            // insert:
            // console.dir(docs);
            myMongo.insert("nhnl_sum", docs, function(err, result) {
                if (err) {
                    console.error(err);
                    return;
                }

                console.log(result);
            });

        } else {
            console.warn('no record');
        }
    });
}

main();
