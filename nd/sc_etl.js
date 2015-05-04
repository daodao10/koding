const re = /<td class="first chartoptionlinks">.*<\/td>\n<td><B>(.*)<\/B><\/td>\n<td><a.*>(.*)<\/a><\/td>\n<td>(.*)<\/td>\n<td>(.*)<\/td>\n<td>(.*)<\/td>\n<td>(.*)<\/td>\n<td>(.*)<\/td>\n<td>(.*)<\/td>\n<td>(.*)<\/td>/g;
const EtlSettingsFile = './sc_settings.json';

var fs = require('fs'),
    Promise = require('promise'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil'),
    MyMongo = require('./MyMongoUtil'),
    config = require('../config.json'),
    EtlSettings = require(EtlSettingsFile);

var today = process.argv.length === 3 ? process.argv[2] : null,
    yesterday = EtlSettings.yesterday,
    remaining = Object.keys(EtlSettings.scan).length,
    myMongo = new MyMongo("{0}{1}".format(config.DbSettings.QuotesDbUri, 'quotes'));


function SCData(scanName) {

    Promise.all(EtlSettings.scan[scanName].map(get))
        .then(function(content) {

            var tx = [];

            if (!today && content && content.length > 0) {
                var arr = /<div class="scc-scans-timestamp">(.*),/.exec(content[0]);
                if (arr && arr.length > 0) {
                    today = new Date(arr[1]);
                    today = today.format('yyyyMMdd');

                    // today = '20150330';
                    // yesterday = '20150327';
                }
            }

            content.forEach(function(element) {
                var x = parse(re, element);
                // console.log('orginal: ', x.length);
                if (x && x.length > 0) {
                    tx = tx.concat(x);
                }
            });

            tx = tx.filter(filter);

            // recall previous data
            myMongo.find(scanName, {
                q: {
                    d: yesterday
                },
                s: {
                    s: 1
                }
            }, function(err, docs) {
                if (err) {
                    console.error(err);
                    return;
                }

                if (docs && docs.length > 0) {
                    tx = tx.map(function(element) {
                        element[9] = !findByName.call(docs, element[0]);
                        return element;
                    });

                    // remove duplicated
                    // var ids = [],
                    //     last;
                    // for (var i = docs.length - 1; i >= 0; i--) {
                    //     if (last === docs[i].s) continue;

                    //     if (findByName.call(tx, docs[i].s)) {
                    //         last = docs[i].s;
                    //         ids.push(docs[i]._id);
                    //         docs[i]["d"] = true;
                    //     }
                    // }
                    // console.log('db.' + scanName + '.remove({ _id: {\'$in\':' + JSON.stringify(ids) + '} })');
                }

                save.call(tx, scanName);

            });

            console.log(scanName, 'final: ', tx.length);

            remaining--;
            if (remaining === 0 && today && today != yesterday) {
                EtlSettings.yesterday = today;
                fs.writeFileSync(EtlSettingsFile, JSON.stringify(EtlSettings, null, 2), {
                    'encoding': 'utf-8'
                });
            }

        }, function(error) {
            console.error('get url[%s] failed, error: %s', error.url, error.error);
        }).catch(function(error) {
            console.log(error);
        });


    function get(url) {
        return new Promise(function(resolve, reject) {
            myUtil.get({
                host: 'stockcharts.com',
                path: url
            }, function(data, statusCode) {

                if (statusCode !== 200) {
                    console.error('error occurred: ', statusCode);
                    reject({
                        url: url,
                        error: statusCode
                    });
                }

                resolve(data);
            });
        });
    }

    function parse(reg, input) {
        var result = [],
            m;
        while ((m = reg.exec(input))) {
            if (m.index === m.lastIndex) {
                m.lastIndex++;
            }
            result.push([m[1], m[2], m[3], m[4], m[5], m[6] === '' ? 0 : Number(m[6]), m[7], Number(m[8]), Number(m[9])]);
        }
        return result;
    }

    function filter(element) {
        return ((element[3] && element[4]) || (EtlSettings.filter.etf && element[6] === 'etf')) && element[7] >= EtlSettings.filter.price && element[8] >= EtlSettings.filter.volume;
    }

    function findByName(name) {
        return this.some(function(element) {
            return element.s === name;
            // return element[0] === name;
        });
    }

    function toJson(element, index) {
        //"JACK","Jack In The Box, Inc.","NASD","Cyclicals","Restaurants & Bars",91.9,"sml",95.73,653131
        return {
            '_id': index,
            'd': today,
            's': element[0], //symbol
            // 't': element[3],//sector
            // 'i': element[4],//industry
            'r': element[5], //stockcharts technical rank
            'u': element[6], //capital size: sml,mid,lrg
            'c': element[7], //close
            'v': element[8], //volume
            'n': element.length === 10 ? element[9] : true
        };
    }

    function doAfter(name, func) {
        if (func) {
            myMongo.find(name, {
                q: {},
                s: {
                    _id: -1
                },
                o: {
                    limit: 1
                }
            }, function(err, docs) {
                if (err) {
                    console.error(err);
                    return;
                }

                var seq = 1;
                if (docs && docs.length === 1) {
                    seq = docs[0]._id + 1;
                }

                func(seq);
            });
        }
    }

    function save(name) {
        var arr = this;
        doAfter(name, function(seq) {
            myMongo.insert(name, arr.map(function(element, index) {
                return toJson(element, index + seq);
            }), function(err, docs) {
                if (err) {
                    console.error(err);
                    return;
                }
            });
        });
    }

}


Object.getOwnPropertyNames(EtlSettings.scan).forEach(function(key, idx, array) {
    SCData(key);
});
