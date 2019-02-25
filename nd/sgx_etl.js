/**
 * 1)
 * https://sgx-premium.wealthmsi.com/sgx/company/priceHistory
 * Request Method:POST
 * application/json : {id: "AAJ"}
 * https://sgx-premium.wealthmsi.com/sgx/search
 * 2)
 * https://sgx-premium.wealthmsi.com/sgx/company
 * Request Method:POST
 * application/json : {id: "AAJ"}
 */

"use strict";

import "./ProtoUtil";
import fs from "fs";
import path from "path";
import vm from "vm";
import myUtil from "./MyUtil";
import CounterUtil from "./CounterUtil";
import inquirer from "inquirer";

var counterUtil = new CounterUtil("counterSG");

function pathResolve(...args) {
  return path.resolve(__dirname, ...args);
}
function _loadJs(vm, filename) {
  if (fs.existsSync(filename)) {
    try {
      let content = fs.readFileSync(filename);
      vm.runInThisContext(content);
      return true;
    } catch (err) {
      console.error("unknown something wrong", err);
    }
  } else {
    console.log("file %s doesn't exist", filename);
  }
  return false;
}

function _post(options) {
  options = myUtil.extend(
    {
      host: "sgx-premium.wealthmsi.com",
      secure: true,
      port: 443,
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    },
    options
  );
  // same command
  // curl -H "Content-Type: application/json" -X POST  --data '{ "id": "1A0" }'  https://sgx-premium.wealthmsi.com/sgx/company/priceHistory

  return new Promise(function(resolve, reject) {
    myUtil.request(options, function(data, statusCode) {
      if (statusCode !== 200) {
        reject({
          url: options.path,
          error: statusCode
        });
      }

      resolve(data);
    });
  });
}

function _get(options) {
  options = myUtil.extend(
    {
      host: "www.sgx.com"
    },
    options
  );

  return new Promise(function(resolve, reject) {
    myUtil.request(options, function(data, statusCode) {
      if (statusCode !== 200) {
        reject({
          url: options.path,
          error: statusCode
        });
      }

      resolve(data);
    });
  });
}

function _getPriceHistory(code) {
  let options = {
    path: "/sgx/company/priceHistory",
    data: JSON.stringify({ id: code })
  };

  return _post(options);
}

function _search(criteria) {
  let options = {
    path: "/sgx/search",
    data: JSON.stringify({ criteria: criteria })
  };

  return _post(options);
}

function _getCompnayInfo(code) {
  let options = {
    path: "/sgx/company",
    // debug:true,
    data: JSON.stringify({ id: code })
  };

  return _post(options);
}

function _save(filePath, content) {
  fs.writeFile(pathResolve(filePath), content, function(err) {
    if (err) {
      throw err;
    }
    console.log("saved.");
  });
}

/**
 * etl sgx market info daily
 */
function sg_market_etl() {
  _search([])
    .then(function(data) {
      let today = new Date().format("yyyyMMdd");
      let dir = pathResolve("sg-mrk-hid");
      let file = `${dir}/data_${today}.json`;
      if (fs.existsSync(file)) {
        file = `${dir}/data_${today}_${new Date()
          .getUTCMilliseconds()
          .toString()
          .padStart(3, "0")}.json`;
      }
      _save(file, data);
    })
    .catch(err => {
      console.error(err);
    });
}

/**
 * etl symbol from sgx.com
 */
function sg_symbol_etl() {
  _search([])
    .then(function(data) {
      data = JSON.parse(data);
      let x = data.companies.map(function(ele) {
        if (ele.companyName && ele.companyName.indexOf(",") >= 0)
          ele.companyName = ele.companyName.replace(",", "");
        if (ele.industry && ele.industry.indexOf(",") >= 0)
          ele.industry = ele.industry.replace(",", " |");
        if (ele.industryGroup && ele.industryGroup.indexOf(",") >= 0)
          ele.industryGroup = ele.industryGroup.replace(",", " |");

        return [
          ele.tickerCode,
          ele.companyName,
          ele.industryGroup,
          ele.industry
        ];
      });

      console.log("symbol,code,name,sector[shareinvestor : sg : daily]");
      //STI.SI,STI,STRAITS TIMES INDEX (STI),Index
      x.forEach(function(ele) {
        // symbol,code,name,sector,industry
        console.log(
          "%s.SI,%s,%s,%s,%s",
          ele[0],
          ele[0],
          ele[1],
          ele[3],
          ele[2]
        );
      });
    })
    .catch(function(err) {
      console.log(err);
    });
}

/**
 * export sg opt symbol list from db
 * @param  {Number} minPrice minimal price of stock
 */
function sg_opt_symbol_etl(minPrice) {
  counterUtil.get({}, (err, docs) => {
    let x = [],
      code,
      jsFile,
      last;
    let dir = pathResolve("../../chart/sg/");
    docs.forEach(doc => {
      code = doc.code;
      jsFile = `${dir}/${code}_d.js`;
      if (_loadJs(vm, jsFile)) {
        last = data[data.length - 1];
        if (last && last[1] >= minPrice) {
          x.push(
            JSON.stringify({
              c: doc.code,
              n: doc.name.toUpperCase(),
              s: doc.sector,
              i: doc.industry,
              mv: doc.mv
            })
          );
        }
      } else {
        console.log("%s not found", code);
      }
    });

    console.log(x.join(",\n"));
  });
}
/**
 * export security opt data from sgx.com
 * @param  {} symbols symbol of stock of index
 * @param  {} isIndex true - export index data, false - export stock data
 */
function export_opt_data(symbols, isIndex) {
  let _dateProcessor = function(dateStr) {
      //19/08/2013: ddMMyyyy
      return dateStr.substr(6, 4) + dateStr.substr(3, 2) + dateStr.substr(0, 2);
    },
    _export = function(data, jsFile) {
      let x = data.map(ele => {
        return "['{0}',{1}]".format(ele[0], ele[1].toFixed(4));
      });

      _save(
        jsFile,
        "var data=[" + x.join(",\n") + '];\nvar source="www.sgx.com"'
      );
    },
    _securityHandler = function(code) {
      _getPriceHistory(code)
        .then(function(content) {
          let json = JSON.parse(content),
            x = json.price.map(ele => {
              return [
                new Date(parseInt(ele.date)).format("yyyyMMdd"),
                ele.value
              ];
            });

          let jsFile = pathResolve("../../chart/sg/", code + "_d.js");
          if (_loadJs(vm, jsFile)) {
            let last = data[data.length - 1];
            x.forEach(function(ele) {
              if (ele[0] > last[0]) {
                data.push(ele);
              }
            });
            _export(data, jsFile);
            // console.log(data);
          } else {
            _export(x, jsFile);
          }
        })
        .catch(function(err) {
          console.log(code, ":", err);
        });
    },
    _indexHandler = function(code) {
      fs.readFile(pathResolve("../chart/d/", `sg_${code}_d.csv`), function(
        err,
        content
      ) {
        if (err) {
          console.log(code, ":", err);
        } else {
          content = content.toString();

          let x = content.split("\n");
          // remove header
          x.shift();
          // remove last blank line
          x.pop();

          x = x.map(function(row) {
            let record = row.stripLineBreaks().split(",");
            return [_dateProcessor(record[0]), myUtil.toNumber(record[4])];
          });

          let jsFile = pathResolve("../../chart/sg/", code + "_d.js");
          if (_loadJs(vm, jsFile)) {
            let last = data[data.length - 1];
            x.forEach(function(ele) {
              if (ele[0] > last[0]) {
                data.push(ele);
              }
            });
            _export(data, jsFile);
            // console.log(data);
          } else {
            _export(x, jsFile);
          }
        }
      });
    };

  if (symbols && Array.isArray(symbols)) {
    symbols.forEach(code => {
      if (isIndex) _indexHandler(code);
      else _securityHandler(code);
    });
  } else {
    // export from sg_shareinvestor.txt
    (function(lines) {
      let cells;
      lines.forEach((line, index) => {
        if (index === 0) return;

        cells = line.split(",");
        if (cells.length > 1) {
          let code = cells[1];

          if (isIndex) {
            // process for index
            if (index < 23) {
              console.log("process", code);
              _indexHandler(code);
            }
          } else {
            // process for security
            if (index > 22) {
              _securityHandler(code);
            }
          }
        }
      });
    })(myUtil.readlinesSync(pathResolve("../chart/s/sg_shareinvestor.txt")));
  }
}

/**
 * get sg company info from sgx.com and then save to files
 * @param  {Array} symbols if symbols is null will get symbols from sg_shareinvestor.txt
 */
function save_sg_company_info(symbols) {
  if (symbols && Array.isArray(symbols)) {
    symbols.forEach(code => {
      _getCompnayInfo(code).then(function(content) {
        _save("./sg-company-hid/" + code + ".json", content);
      });
    });
  } else {
    (function(lines) {
      let cells;
      lines.forEach((line, index) => {
        if (index === 0) return;
        cells = line.split(",");
        if (cells.length > 1) {
          let code = cells[1];
          //TODO: hard code 22 - stock index starts from
          if (index > 22) {
            _getCompnayInfo(code).then(function(content) {
              _save("./sg-company-hid/" + code + ".json", content);
            });
          }
        }
      });
    })(myUtil.readlinesSync(pathResolve("../chart/s/sg_shareinvestor.txt")));
  }
}

/**
 * store stock [symbol,code,name,sector,industry] to db
 */
function storeToDB() {
  // symbol,code,name,sector,industry
  (function(lines) {
    let docs = [];
    lines.forEach((line, index) => {
      if (index == 0) return;
      let cells = line.split(",");
      docs.push({
        _id: cells[0],
        code: cells[1],
        name: cells[2],
        sector: cells[3],
        industry: cells[4]
      });
    });
    counterUtil.update(docs, "insert qualitified docs");
  })(myUtil.readlinesSync(pathResolve("../chart/s/sg_shareinvestor.txt")));
}
/**
 * patch to store stock
 */
function patch() {
  // let query = { sector: { $ne: 'Index' } };
  let query = { $and: [{ sector: { $ne: "Index" } }, { mv: null }] };
  counterUtil.get(query, (err, docs) => {
    if (err) {
      console.error(err);
      return;
    }

    let updated = false;
    let dir = pathResolve("./sg-company-hid/");
    docs.forEach(doc => {
      let filename = `${dir}/${doc.code}.json`;
      if (fs.existsSync(filename)) {
        let content = fs.readFileSync(filename, "utf8");
        let json = JSON.parse(content);
        doc["mv"] =
          json.company && json.company.companyInfo
            ? json.company.companyInfo.sharesOutstanding
            : null;
        updated = true;
      } else {
        console.log("cannot find", doc.code);
      }
    });

    if (updated) counterUtil.update(docs, "patch for counterSG");
  });
}

const funcList = {
  sg_market_etl: sg_market_etl,
  sg_symbol_etl: sg_symbol_etl,
  sg_opt_symbol_etl: sg_opt_symbol_etl,
  save_sg_company_info: save_sg_company_info,
  export_opt_data: export_opt_data,
  store_to_DB: storeToDB,
  patch_store_to_DB: patch
};
const funcNameList = [...Object.getOwnPropertyNames(funcList)];

function prompt() {
  inquirer
    .prompt({
      type: "list",
      name: "func",
      message: "what is your CAI ?",
      choices: funcNameList
    })
    .then(answers => {
      console.log("DO ===>");
      if (answers.func === "sg_opt_symbol_etl") {
        goin_sg_opt_symbol_etl(answers.func);
      } else if (answers.func === "export_opt_data") {
        goin_export_opt_data(answers.func);
      } else {
        doFunc(answers.func);
      }
    });
}

function goin_sg_opt_symbol_etl(func) {
  inquirer
    .prompt({
      type: "input",
      name: "minPrice",
      message: "Min Price ?",
      validate: function(value) {
        let valid = !isNaN(parseFloat(value));
        return valid || "Please enter a number";
      },
      filter: Number
    })
    .then(answers => {
      doFunc(func, answers.minPrice);
    });
}
function goin_export_opt_data(func) {
  inquirer
    .prompt({
      type: "checkbox",
      name: "isIndex",
      message: "Is index ?",
      choices: [
        {
          name: "Yes"
        }
      ]
    })
    .then(answers => {
      doFunc(func, null, answers.isIndex.length > 0);
    });
}
const doFunc = (func, ...rest) => {
  console.log(`\t${func} (${[...rest]})\n------------------------`);
  if (funcNameList.includes(func)) {
    funcList[func](...rest);
  } else {
    console.error(`wrong func name [${func}]`);
  }
};

if (process.argv.length == 2) {
  prompt();
} else {
  let [func, ...rest] = process.argv.slice(2);
  doFunc(func, ...rest);
}

// -rw-r--r--  1 dao  staff  \s*\d+ Nov 13 \d{2}:\d{2} ([A-Z0-9]+)_d\.js
// -rw-r--r--  1 dao  staff  \s*\d+ Nov \d+  \d{4} ([A-Z0-9]+)\.json
// -rw-r--r--  1 dao  staff     75 Nov 13 \d{2}:\d{2} ([A-Z0-9]+)\.json

// export_opt_data([
//     '5UJ',
//     'ADJ',
//     'Z74'
// ], false);

// save_sg_company_info([
//     'H27',
// ]);
