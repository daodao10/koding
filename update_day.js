print("-------------------------");

var action = 3;
var db = db.getSiblingDB("quotes");

if (action === 1) {
    print("update tmc2gpd_day...");
    db.tmc2gdp_day.update({
        "_id": ObjectId("546e006d16178c01cbbaeb72")
    }, {
        $set: {
            date: "20141119"
        }
    });
    print("update tmc2gpd_his...");
    db.tmc2gdp_his.update({
        "_id": ObjectId("546c024e43b91204bcd4bc28")
    }, {
        $set: {
            date: "20141118"
        }
    });
    db.tmc2gdp_his.update({
        "_id": ObjectId("546e006d16178c01cbbaeb73")
    }, {
        $set: {
            date: "20141119"
        }
    });
    db.tmc2gdp_his.update({
        "_id": ObjectId("546ea23443b91228bc5f22bb")
    }, {
        $set: {
            date: "20141120"
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
