/// <reference path="../../node.d.ts" />

'use strict';

var fs = require('fs'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil'),
    MyMongo = require('./MyMongoUtil'),
    config = require('../config.json'),
	CsvSerieUtil = require('./CsvSerieUtil');

class DbSerieUtil{
	public myMongo;
	private csvUtil = new CsvSerieUtil();

	constructor(connectUrl){
		this.myMongo =  new MyMongo(connectUrl);
	}

	get(docName, query) {
		var _self = this;
		return new Promise(function(resolve, reject) {
		    _self.myMongo.find(docName, {
		        q: query
		    }, function(err, docs) {
		        if (err) {
		            reject(err);
		            return;
		        }

		        resolve(docs);
		    });
		});
	}

	toSeries(docs:Array<Object>, cols:Array<Array<String>>){
		var rows = this.toCsv(docs, cols);
		var content = this.csvUtil.toSeries(rows);
		//TODO: save ?
		console.log(content);
	}

	toCsv(docs:Array<Object>, cols:Array<Array<String>>): Array<Array<Object>>{
		var _self = this;
		if(docs && cols && Object.keys(docs[0]).length == cols.length) {
			var rows= [];

			docs.forEach((doc, index)=>{
				var row = [];
				cols.forEach((col)=>{
					row.push(doc[col[0]]);
				});
				rows.push(row);
			});
			rows.sort(_self.csvUtil.sort);

			rows.unshift(cols.map((col)=> col[1]));
			console.log('smell good');
			return rows;
		} else {
			console.log('smell bad');
			return null;
		}
	}

	extractSeries(docName, query, cols): void {
		var _self = this;
		_self.get(docName, query).then((docs)=>{
			_self.toSeries(docs, cols);
		}).catch((err)=>{
			console.error('get for ', docName, query, err);
		});
	}

	extractCsv(docName, query, cols, csvFile): void {
		var _self = this;
		_self.get(docName, query).then((docs)=>{
			var rows = _self.toCsv(docs, cols);
			if(rows) {
				_self.csvUtil.save(csvFile, rows.join('\n'));
			}
		}).catch((err)=>{
			console.error('get for ', docName, query, err);
		});
	}

	extractOpt(docName, query, cols, optFile): void {
		var _self = this;
		_self.get(docName, query).then((docs)=>{
			var newRows = [], item;
			var rows = _self.toCsv(docs, cols);
			for (var i = 1; i <rows.length; i++) {
				item = rows[i];
				if(item[1] && item[1] > 0) { // value > 0 => format date
					newRows.push([new Date(item[0]).format('yyyyMMdd'), item[1]]);
				}
			}
			rows = null;
			_self.csvUtil.save(optFile, "var data=" + JSON.stringify(newRows) + ";var source=\"dao.farbox.com\"");
		}).catch((err)=>{
			console.error('get for ', docName, query, err);
		});
	}

}

var util = new DbSerieUtil("{0}{1}".format(config.DbSettings.QuotesDbUri, 'quotes'));
// util.extractSeries('BDI', null, [['_id','date'],['c','value']]);
// util.extractCsv('BDI', null, [['_id','date'],['c','value']], './BDI.csv');
util.extractOpt('BDI', null, [['_id','date'],['c','value']], "../../daodao10.github.io/chart/world/BDI_m.js");
util.extractCsv('MV', null, [['_id','date'],['tmc','tmc'],['cmc','cmc'],['gdp','gdp']], './MV.csv');
