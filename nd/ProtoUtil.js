module.exports = (function() {
    Date.prototype.format = function(style) {
        /// style:
        /// yyyy-MM-dd
        /// yyyy-MM-dd hh:mm:ss
        var options = {
            "M+": this.getMonth() + 1, // month 
            "d+": this.getDate(), // day 
            "h+": this.getHours(), // hour
            "m+": this.getMinutes(), // minute 
            "s+": this.getSeconds(), // second 
            "q+": Math.floor((this.getMonth() + 3) / 3), // quarter 
            "S": this.getMilliseconds() // millisecond 
        };
        if (/(y+)/.test(style)) {
            style = style.replace(RegExp.$1, this.getFullYear().toString().substr(4 - RegExp.$1.length));
        }
        for (var key in options) {
            if (new RegExp("(" + key + ")").test(style)) {
                style = style.replace(RegExp.$1, (RegExp.$1.length == 1) ?
                    options[key] :
                    ("00" + options[key]).substr(options[key].toString().length));
            }
        }
        return style;
    };


    if (!String.prototype.stripLineBreaks) {
        String.prototype.stripLineBreaks = function() {
            if (this) {
                return this.replace(/(\r\n|\n|\r)/gm, '');
            }
            return this;
        };
    }
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
    if (!String.prototype.format) {
        String.prototype.format = function() {
            var args = arguments;
            return this.replace(/\{(\d+)\}/g, function(m, i) {
                return args[i];
            });
        };
    }

    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function(prefix) {
            return this.indexOf(prefix) === 0;
        };
    }
    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function(searchString, position) {
            var subjectString = this.toString();
            if (position === undefined || position > subjectString.length) {
                position = subjectString.length;
            }
            position -= searchString.length;
            var lastIndex = subjectString.indexOf(searchString, position);
            return lastIndex !== -1 && lastIndex === position;
        };
        // b)
        //     String.prototype.endsWith = function(suffix) {
        //         return str.match(suffix + "$") == suffix;
        //     };
    }

    if (!String.prototype.padding) {
        String.prototype.padding = function(n, c) {
            /// c: character
            /// n: duplicate number of the character

            c = c || '0';
            return (this.length < n) ? c + this.padding(n - 1, c) : this;
        };
    }

    Array.prototype.clear = function() {
        this.splice(0, this.length);
    };

    Array.prototype.chunk = function(chunkSize) {
        // console.log(chunkSize);
        // a)
        // if (!this.length) {
        //     return [];
        // }
        // console.log('here');
        // return [this.slice(0, chunkSize)].concat(this.slice(chunkSize).chunk(chunkSize));
        // b)
        return this.reduce(function(n) {
            return function(p, c, i) {
                (p[i / n | 0] = p[i / n | 0] || []).push(c);
                return p;
            };
        }(chunkSize), []);
    };

}());
