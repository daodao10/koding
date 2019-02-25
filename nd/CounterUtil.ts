/// <reference path="../../node.d.ts" />


require('./ProtoUtil');

const MyMongo = require('./MyMongoUtil'),
    config = require('../config.json');

export default class CounterUtil {
    private mock = false;
    private myMongo = new MyMongo(`${config.DbSettings.DbUri}test`);
    private counterDb: string;

    constructor(counterDb: string) {
        this.counterDb = counterDb;
    }

    private log(msg, err, result): void {
        if (err) {
            console.error(err);
        } else {
            console.log('%s done', msg);
            console.dir(result);
        }
    }

    public update(rows, msg): void {
        var _this = this;
        if (this.mock) {
            console.log(msg, rows.length);
            console.log('first', rows[0]);
        } else {
            this.myMongo.upsertBatch(this.counterDb, rows, function (err, result) {
                _this.log(msg, err, result);
            });
        }
    }

    public get(query, func): void {
        this.myMongo.find(this.counterDb, {
            q: query,
            s: { _id: 1 }
        }, func);
    }

}