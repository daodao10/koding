var fs = require('fs'),
    Promise = require('promise'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil'),
    MyMongo = require('./MyMongoUtil'),
    config = require('../config.json');

var re = /<td class="first chartoptionlinks">.*<\/td>\n<td><B>(.*)<\/B><\/td>\n<td><a.*>(.*)<\/a><\/td>\n<td>(.*)<\/td>\n<td>(.*)<\/td>\n<td>(.*)<\/td>\n<td>(.*)<\/td>\n<td>(.*)<\/td>\n<td>(.*)<\/td>\n<td>(.*)<\/td>/g;
var SCAN = {
        'N52WH': ['/def/servlet/SC.scan?s=I.Y|TVDL[T.T_EQ_S]![T.E_EQ_Y]![AS0,20,TV_GT_40000]![TH0_GT_AM1,253,TH]',
            '/def/servlet/SC.scan?s=I.Y|TVDL[T.T_EQ_S]![T.E_EQ_N]![T.E_NE_O]![AS0,20,TV_GT_40000]![TH0_GT_AM1,253,TH]',
            '/def/servlet/SC.scan?s=I.Y|TVDL[T.T_EQ_S]![T.E_EQ_X]![AS0,20,TV_GT_40000]![TH0_GT_AM1,253,TH]'
        ],
        'N52WL': ['/def/servlet/SC.scan?s=I.Y|TVDL[T.T_EQ_S]![T.E_EQ_Y]![AS0,20,TV_GT_40000]![TL0_LT_AN1,253,TL]',
            '/def/servlet/SC.scan?s=I.Y|TVDL[T.T_EQ_S]![T.E_EQ_N]![T.E_NE_O]![AS0,20,TV_GT_40000]![TL0_LT_AN1,253,TL]',
            '/def/servlet/SC.scan?s=I.Y|TVDL[T.T_EQ_S]![T.E_EQ_X]![AS0,20,TV_GT_40000]![TL0_LT_AN1,253,TL]'
        ],
        'TTB': ['/def/servlet/SC.scan?s=I.Y|TSAL[T.T_EQ_S]![T.E_EQ_Y]![AS0,20,TV_GT_40000]![YM_EQ_1]',
            '/def/servlet/SC.scan?s=I.Y|TSAL[T.T_EQ_S]![T.E_EQ_N]![T.E_NE_O]![AS0,20,TV_GT_40000]![YM_EQ_1]',
            '/def/servlet/SC.scan?s=I.Y|TSAL[T.T_EQ_S]![T.E_EQ_X]![AS0,20,TV_GT_40000]![YM_EQ_1]'
        ],
        'STTB': ['/def/servlet/SC.scan?s=I.Y|TSAL[T.T_EQ_S]![T.E_EQ_Y]![AS0,20,TV_GT_40000]![YH_EQ_1]',
            '/def/servlet/SC.scan?s=I.Y|TSAL[T.T_EQ_S]![T.E_EQ_N]![T.E_NE_O]![AS0,20,TV_GT_40000]![YH_EQ_1]',
            '/def/servlet/SC.scan?s=I.Y|TSAL[T.T_EQ_S]![T.E_EQ_X]![AS0,20,TV_GT_40000]![YH_EQ_1]'
        ],
        'QTB': ['/def/servlet/SC.scan?s=I.Y|TSAL[T.T_EQ_S]![T.E_EQ_Y]![AS0,20,TV_GT_40000]![YJ_EQ_1]',
            '/def/servlet/SC.scan?s=I.Y|TSAL[T.T_EQ_S]![T.E_EQ_N]![T.E_NE_O]![AS0,20,TV_GT_40000]![YJ_EQ_1]',
            '/def/servlet/SC.scan?s=I.Y|TSAL[T.T_EQ_S]![T.E_EQ_X]![AS0,20,TV_GT_40000]![YJ_EQ_1]'
        ],
        'TBB': ['/def/servlet/SC.scan?s=I.Y|TSAL[T.T_EQ_S]![T.E_EQ_Y]![AS0,20,TV_GT_40000]![YQ_EQ_1]',
            '/def/servlet/SC.scan?s=I.Y|TSAL[T.T_EQ_S]![T.E_EQ_N]![T.E_NE_O]![AS0,20,TV_GT_40000]![YQ_EQ_1]',
            '/def/servlet/SC.scan?s=I.Y|TSAL[T.T_EQ_S]![T.E_EQ_X]![AS0,20,TV_GT_40000]![YQ_EQ_1]'
        ],
        'STBB': ['/def/servlet/SC.scan?s=I.Y|TSAL[T.T_EQ_S]![T.E_EQ_Y]![AS0,20,TV_GT_40000]![YI_EQ_1]',
            '/def/servlet/SC.scan?s=I.Y|TSAL[T.T_EQ_S]![T.E_EQ_N]![T.E_NE_O]![AS0,20,TV_GT_40000]![YI_EQ_1]',
            '/def/servlet/SC.scan?s=I.Y|TSAL[T.T_EQ_S]![T.E_EQ_X]![AS0,20,TV_GT_40000]![YI_EQ_1]'
        ],
        'QBB': ['/def/servlet/SC.scan?s=I.Y|TSAL[T.T_EQ_S]![T.E_EQ_Y]![AS0,20,TV_GT_40000]![YN_EQ_1]',
            '/def/servlet/SC.scan?s=I.Y|TSAL[T.T_EQ_S]![T.E_EQ_N]![T.E_NE_O]![AS0,20,TV_GT_40000]![YN_EQ_1]',
            '/def/servlet/SC.scan?s=I.Y|TSAL[T.T_EQ_S]![T.E_EQ_X]![AS0,20,TV_GT_40000]![YN_EQ_1]'
        ]
    },
    settings = {
        price: 1,
        volume: 300000,
        etf: true
    },
    today,
    yesterday,
    myMongo = new MyMongo("{0}{1}".format(config.DbSettings.DbUri, 'quotes'));


function SCData(scanName) {

    Promise.all(SCAN[scanName].map(get))
        .then(function(content) {

            var tx = [];

            if (!today && content && content.length > 0) {
                var arr = /<div class="scc-scans-timestamp">(.*),/.exec(content[0]);
                if (arr && arr.length > 0) {
                    today = new Date(arr[1]);
                    yesterday = new Date(today - 1000 * 60 * 60 * 24);
                    today = today.format('yyyyMMdd');
                    yesterday = yesterday.format('yyyyMMdd');

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

        }).catch(function(statusCode) {
            console.log(statusCode);
        });


    function get(url) {
        return new Promise(function(resolve, reject) {
            myUtil.get({
                host: 'stockcharts.com',
                path: url
            }, function(data, statusCode) {

                if (statusCode !== 200) {
                    console.error('error occurred: ', statusCode);
                    reject(statusCode);
                }

                resolve(data.toString());
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
        return ((element[3] && element[4]) || (settings.etf && element[6] === 'etf')) && element[7] >= settings.price && element[8] >= settings.volume;
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
            's': element[0],
            't': element[3],
            'i': element[4],
            'r': element[5],
            'u': element[6],
            'c': element[7],
            'v': element[8],
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

Object.getOwnPropertyNames(SCAN).forEach(function(key, idx, array) {
    SCData(key);
});