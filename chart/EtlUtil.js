var EtlUtil = function () { };

var UserException = function (message) {
    this.message = message;
    this.name = "UserException";
};

EtlUtil.prototype = UserException;

EtlUtil.prototype.encode_period = function (type) {
    if (type === undefined || type === "daily") {
        return 'd';
    } else if (type === "monthly") {
        return 'm';
    } else if (type === "weekly") {
        return 'w';
    } else {
        throw new UserException("unknown period setting");
    }
};

EtlUtil.prototype.encode_source = function (source) {
    if (source === undefined || source === "yahoo") {
        return "Y";
    } else if (source === "stooq") {
        return "SQ";
    } else if (source === "shareinvestor") {
        return "SI";
    } else if (source === "sgx") {
        return "SGX";
    } else if (source === "wstock") {
        return "WS";
    } else if (source === "wstock2") {
        return "WS2";
    } else if (source === "dao") {
        return "D";
    } else if (source === "google") {
        return "G";
    } else if (source === 'tushare') {
        return 'TS'
    }
    else {
        throw UserException("unknown data source");
    }
};

EtlUtil.prototype.decode_source = function (source) {
    if (source === undefined || source === "Y") {
        return "finance.yahoo.com";
    } else if (source === "SQ") {
        return "stooq.com";
    } else if (source === "SI") {
        return "shareinvestor.com";
    } else if (source === "SGX") {
        return "www.sgx.com";
    } else if (source === "WS" || source === "WS2" ) {
        return "wstock.net";
    } else if (source === "D") {
        return "dao";
    } else if (source === "G") {
        return "finance.google.com";
    } else if (source === "TS") {
        return "finance.sina.com"
    } else {
        throw UserException("unknown data source");
    }
};

EtlUtil.prototype.parse_setting = function (data) {
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
        throw UserException("unknown period setting");
    }

    // console.log("setting: ", setting);
    return setting;
};

module.exports = new EtlUtil();
