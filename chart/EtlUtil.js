var EtlUtil = function() {};

var UserException = function(message) {
    this.message = message;
    this.name = "UserException";
};

EtlUtil.prototype = UserException;

EtlUtil.prototype.encode_period = function(type) {
    if (type === undefined || type === "daily") {
        return 'd';
    } else if (type === "monthly") {
        return 'm';
    } else if (type === "weekly") {
        return 'w';
    } else {
        throw new UserException("unknown data source");
    }
};

EtlUtil.prototype.encode_source = function(source) {
    if (source === undefined || source === "yahoo") {
        return "Y";
    } else if (source === "stooq") {
        return "SQ";
    } else if (source === "shareinvestor") {
        return "SI";
    } else if (source === "wstock") {
        return "WS";
    } else {
        throw UserException("unknown data source");
    }
};

EtlUtil.prototype.decode_source = function(source) {
    if (source === undefined || source === "Y") {
        return "finance.yahoo.com";
    } else if (source === "SQ") {
        return "stooq.com";
    } else if (source === "SI") {
        return "shareinvestor.com";
    } else if (source === "WS") {
        return "wstock.net";
    } else {
        throw UserException("unknown data source");
    }
};

EtlUtil.prototype.parse_setting = function(data) {
    var matches = /\[(\w+)\s*:\s*(\w+)\s*:\s*(\w+)(,\s*(\w+))*\]/gi.exec(data);
    var setting = {
        "source": matches[1],
        "market": matches[2]
    };

    if (matches.length > 4) {
        if (matches[5]) {
            setting["period"] = [matches[3], matches[5]];
        } else {
            setting["period"] = [matches[3]];
        }
    } else {
        setting["period"] = [matches[3]];
    }

    console.log("setting: ", setting);
    return setting;
};

module.exports = new EtlUtil();
