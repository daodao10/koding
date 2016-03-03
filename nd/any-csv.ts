/// <reference path="../../node.d.ts" />

"use strict";

var CsvSerieUtil = require('./CsvSerieUtil');

var util = new CsvSerieUtil(true);
// util.extract('./801790.csv', '../../daodao10.github.io/chart/dao/801790.js');
util.extract('./801790.csv', './801790.js');
