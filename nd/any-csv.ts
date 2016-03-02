/// <reference path="../../node.d.ts" />

"use strict";

var CsvSerieUtil = require('./CsvSerieUtil');

var util = new CsvSerieUtil();
util.extract('./_801040_黑色金属.csv', '../../daodao10.github.io/chart/dao/801040.js');
