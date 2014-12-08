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
    } else {
        throw UserException("unknown data source");
    }
};

module.exports = new EtlUtil();