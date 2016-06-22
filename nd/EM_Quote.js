
var fs = require('fs'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil');

var
    Urls = {
        //host: hqdigi2.eastmoney.com
        'Quote': '/EM_Quote2010NumericApplication/Index.aspx?type=F&jsName=zjlx_hq&id={0}&rt=48473768',
        //host: nufm.dfcfw.com
        'FA': '/EM_Finance2014NumericApplication/JS.aspx?type={reportType}&sty={subReportType}&st=(Code)&sr=1&p={page}&ps={pageSize}&js=var%20daoESData={pages:(pc),data:[(x)]}{param}',
        //host: datainterface.eastmoney.com
        'DC': '/EM_DataCenter/JS.aspx?type={reportType}&sty={subReportType}&st={sortType}&sr={sortRule}&p={page}&ps={pageSize}&js=var%20daoESData={pages:(pc),data:[(x)]}{param}'
    },
    debug = false;

function _get(options) {
    return new Promise(function (resolve, reject) {
        myUtil.get(options, function (data, statusCode) {
            if (debug) {
                console.log(options.path);
            }
            if (statusCode !== 200) {
                if (debug) console.error('error occurred: ', statusCode);
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
    fs.writeFile(csvFile, data, function (err) {
        if (err) {
            throw err;
        }
        console.log('saved.');
    });
}


function EM_Quote() { }

EM_Quote.prototype.Path = function (options) {
    this.path = _prepareUrl(options);
};

EM_Quote.prototype.Runner = function (options) {

    var options = myUtil.extend({
        //host:"",
        //path: "",
        //csvFile:"",
        //urlParam:[]
        getByPage: function (pageIndex) {
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
        exec: function (maxBatch, reject, resolve) {
            if (!maxBatch) maxBatch = 50;
            options.getByPage(1).then(function (data) {
                eval(data);

                // get paging info
                var indices = [1];
                for (var i = 2; i <= daoESData.pages && i <= maxBatch; i++) {
                    indices.push(i)
                }
                if (debug) {
                    // console.log(refine(daoESData.data[0]));
                    console.log('total page: %d', daoESData.pages);
                }

                var result = [options.header()];
                Promise.all(indices.map(options.getByPage)).then(function (contents) {
                    if (debug) {
                        console.log('done');
                    }

                    if (resolve) resolve(1);

                    contents.forEach(function (content, index) {
                        eval(content);

                        if (daoESData && daoESData.data.length > 0) {
                            result = result.concat(options.refine ? daoESData.data.map(options.refine) : daoESData.data);
                            // result = result.concat(daoESData.data);
                        } else {
                            throw new Error('parse failed, page {0}'.format((index + 1).toString()));
                        }
                    });

                }, function (err) {
                    if (reject) reject(err);
                    else throw new Error('get failed, url: {0}, error: {1}'.format(err.url, err.error));
                }).then(function () {
                    if (options.csvFile) {
                        // save('./est.csv', iconv.encode(result.join('\n') + "\n", 'GB18030'));
                        _save(options.csvFile, result.join('\n') + "\n");
                    } else {
                        console.dir(result);
                        // console.log(result.join('\n') + "\n");
                    }
                }).catch(function (err) {
                    throw err;
                });

            });
        }
    }
};

module.exports = new EM_Quote();
