/// <reference path="../../node.d.ts" />

"use strict";

var fs = require('fs'),    
	myUtil = require('./MyUtil'),
    anounymous = require('./ProtoUtil');

class CsvSerieUtil {

	constructor(){}

    /**
     * convert string of date to timestamp
     * @param  {String} strDate [yyyyMMdd] or [yyyy-MM-dd]
     * @param  {Boolean} true - strDate [yyyyMMdd] else strDate [yyyy-MM-dd]
     * @return {long}
     */
    toUtcDate(strDate, isCompact) {
        if (isCompact) {
            return new Date(Date.UTC(parseInt(strDate.substring(0, 4), 10), parseInt(strDate.substring(4, 6), 10) - 1, parseInt(strDate.substring(6, 8)))).getTime();
        }

        return new Date(Date.UTC(parseInt(strDate.substring(0, 4), 10), parseInt(strDate.substring(5, 7), 10) - 1, parseInt(strDate.substring(8, 10)))).getTime();
    }

	doSomething(srcFile: string){
		var _self = this;
	    fs.readFile(srcFile, function(err, data) {
	    	var lines = data.toString().split(/\r\n|\n/),
	    		rows = [];
	    	lines.forEach((line, index:number)=>{
	    		var cells = line.split(',');
	    		if(index == 0){
                	rows.push(cells);
	    		}else{
	    			// special process item
					if(cells[0]) {
						cells[0] = _self.toUtcDate(cells[0], true);
		    		}
					rows.push(cells);
	    		}
    			
	    	});

	    	// console.dir(rows);
	    	_self.toSeries(rows);
    	});
	}

	toSeries(rows:Array<Array<Object>>){
		var series = {}, prefix = 'it_';

		rows.sort((a: Array<number>,b: Array<number>) => {
			return a[0] - b[0];
		});
		rows.forEach((cells, index) => {
			if(index == 0) {
				cells.forEach((item, itemIndex) => {
					if(itemIndex > 0) {
						series[prefix + itemIndex.toString()] = {
							n: item,
							d: []
						};
					}
				});
			} else {
				for (var i = 1; i < cells.length; ++i) {
					series[prefix + i.toString()].d.push([cells[0], Number(cells[i])]);
				}
			}
		});

		console.log("define(" + JSON.stringify(series) + ");");
	}

}

module.exports = CsvSerieUtil;
