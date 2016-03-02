/// <reference path="../../node.d.ts" />

'use strict';

var fs = require('fs'),
    myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil'),
    MyMongo = require('./MyMongoUtil'),
    config = require('../config.json');
    require('./CsvSerieUtil');

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

	toSeries(docs:Array<Object>, cols:Array<Array<Object>>){
		var rows = this.toCsv(docs, cols);
		this.csvUtil.toSeries(rows);
	}

	toCsv(docs:Array<Object>, cols:Array<Array<String>>): Array<Array<Object>>{
		if(docs && cols && Object.keys(docs[0]).length == cols.length) {
			var rows= [];
			rows[0] = [];
			cols.forEach((col)=>{
				rows[0].push(col[1]);
			});
			docs.forEach((doc, index)=>{
				var row = [];
				cols.forEach((col)=>{
					row.push(doc[col[0]]);
				});
				rows.push(row);
			});
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
				fs.writeFile(csvFile, rows.join('\n'), function(err) {
			        if (err) {
			            throw err;
			        }
			        console.log('saved.');
		   		});
			}
		}).catch((err)=>{
			console.error('get for ', docName, query, err);
		});
	}
}

var util = new DbSerieUtil("{0}{1}".format(config.DbSettings.QuotesDbUri, 'quotes'));
// util.extractSeries('BDI', null, [['_id','date'],['c','value']]);
util.extractCsv('BDI', null, [['_id','date'],['c','value']], './BDI.csv');
