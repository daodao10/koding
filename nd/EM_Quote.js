//http://hqdigi2.eastmoney.com/EM_Quote2010NumericApplication/Index.aspx?Type=F&jsName=zjlx_hq&id=6000371&rt=48473768

var fs = require('fs'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil');

var Urls = {
        'Quote': '/EM_Quote2010NumericApplication/Index.aspx?type=F&jsName=zjlx_hq&id={0}&rt=48473768',
        'FA': '/EM_Finance2014NumericApplication/JS.aspx?type={reportType}&sty={subReportType}&st=(Code)&sr=1&p={page}&ps={pageSize}&js=var%20daoESData={pages:(pc),data:[(x)]}{param}',
        'DC': '/EM_DataCenter/JS.aspx?type={reportType}&sty={subReportType}&st={sortType}&sr={sortRule}&p={page}&ps={pageSize}&js=var%20daoESData={pages:(pc),data:[(x)]}{param}'
    },
    debug = true;

function _get(options) {
    return new Promise(function(resolve, reject) {
        myUtil.get(options, function(data, statusCode) {
            if (debug) {
                console.log(options.path);
            }
            if (statusCode !== 200) {
                console.error('error occurred: ', statusCode);
                reject({
                    url: options.path,
                    error: statusCode
                });
            }

            resolve(data);
        });
    });
}

function _prepareUrl(options) {
    var _param = options.param,
        _sort = "1",
        param = "";

    for (var key in _param) {
        param += ("&" + key + "=" + _param[key])
    }

    _url = Urls[options.dataType];

    _url = _url.replace("{reportType}", options.reportType);
    _url = _url.replace("{subReportType}", options.subReportType);
    _url = _url.replace("{pageSize}", options.pagesize);
    _url = _url.replace("{page}", options.page);
    _url = _url.replace("{sortType}", options.sort.id);
    _url = _url.replace("{sortRule}", options.sort.desc ? "-1" : "1");
    _url = _url.replace("{param}", param);

    return _url
};

function _save(csvFile, data) {
    fs.writeFile(csvFile, data, function(err) {
        if (err) {
            throw err;
        }
        console.log('saved.');
    });
}


function EM_Quote() {}

EM_Quote.prototype.Path = function(options) {
    this.path = _prepareUrl(options);
};

EM_Quote.prototype.Runner = function(options) {

    var options = myUtil.extend({
        //host:"",
        //path: "",
        //csvFile:"",
        //urlParam:[]
        getByPage: function(pageIndex) {
            if (debug) {
                console.log('get data for page:', pageIndex);
            }
            return _get({
                host: options.host,
                path: options.path.format(pageIndex, options.urlParam)
            });
        },
        // header: function() {
        // },
        // refine: function(line) {
        // };
    }, options);

    return {
        // options: options,
        exec: function() {
            options.getByPage(1).then(function(data) {
                eval(data);

                // get paging info
                var indices = [1];
                for (var i = 2; i <= daoESData.pages; i++) {
                    indices.push(i)
                }
                if (debug) {
                    // console.log(refine(daoESData.data[0]));
                    console.log('total page: %d', indices.length);
                }

                var result = [options.header()];
                Promise.all(indices.map(options.getByPage)).then(function(contents) {
                    if (debug) {
                        console.log('done');
                    }

                    contents.forEach(function(content, index) {
                        eval(content);

                        if (daoESData && daoESData.data.length > 0) {
                            result = result.concat(options.refine ? daoESData.data.map(options.refine) : daoESData.data);
                            // result = result.concat(daoESData.data);
                        } else {
                            throw new Error('page {0}, parse failed'.format((index + 1).toString()));
                        }
                    });

                }, function(error) {
                    throw new Error('page {0}: get failed, error: {1}'.format(error.page, error.error));
                }).then(function() {
                    if (options.csvFile) {
                        // save('./est.csv', iconv.encode(result.join('\n') + "\n", 'GB18030'));
                        _save(options.csvFile, result.join('\n') + "\n");
                    } else {
                        console.dir(result);
                        // console.log(result.join('\n') + "\n");
                    }
                }).catch(function(error) {
                    throw error;
                });

            });
        }
    }
};

module.exports = new EM_Quote();
