print("-------------------------");

var action = 0;
var db = db.getSiblingDB("quotes");

if (action === 1) {
    print("update tmc2gpd_day...");
    db.tmc2gdp_day.update({
        "_id": ObjectId("5485162c43b912205827e380")
    }, {
        $set: {
            date: "20141205",
            table: "<b>12/06/2014</b>Ratio = <b>128%</b>, <font class='callr'>Significantly Overvalued</font>",
            desc: "As of today, the Total Market Index is at <b>$ 21775.2 billion</b>, which is about <b>128%</b> of the last reported GDP. The US stock market is positioned for an average annualized return of <b>0.6%</b>,estimated from the historical valuations of the stock market. This includes the returns from the dividends, currently yielding at 2%."
        }
    });
    db.tmc2gdp_day.update({
        "date": "20141209"
    }, {
        $set: {
            date: "20141208"
        }
    });
    print("update tmc2gpd_his...");
    db.tmc2gdp_his.update({
        "_id": ObjectId("5485162c43b912205827e381")
    }, {
        $set: {
            date: "20141205"
        }
    });
    db.tmc2gdp_his.update({
        "_id": ObjectId("5486740243b912207ce0911b")
    }, {
        $set: {
            date: "20141208"
        }
    });
} else if (action === 2) {
    print("update summary...");
    db.summary.update({
        date: "20141120"
    }, {
        $set: {
            date: "20141119"
        }
    });
    db.summary.update({
        date: "20141121"
    }, {
        $set: {
            date: "20141120"
        }
    });
    print("update China day...");
    db.day.update({
        $and: [{
            date: "20141120"
        }, {
            $or: [{
                market: "SH"
            }, {
                market: "SZ"
            }]
        }]
    }, {
        $set: {
            date: "20141119"
        }
    }, {
        multi: true
    });
    db.day.update({
        $and: [{
            date: "20141121"
        }, {
            $or: [{
                market: "SH"
            }, {
                market: "SZ"
            }]
        }]
    }, {
        $set: {
            date: "20141120"
        }
    }, {
        multi: true
    });
}

print("=========================");
