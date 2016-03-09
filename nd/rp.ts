/// <reference path="../../node.d.ts" />

'use strict';
import {Colors} from './Colors';
var myUtil = require('./MyUtil');

class RP {
	private out = new Colors();
	constructor(public schedule = require('node-schedule'), private wl = require('./wl-sample.json')) {
		console.log('job start...');
	}

	start():void{
		var _self = this;
		var j = _self.schedule.scheduleJob('*/1 * * * *', ()=>{
			// console.log(new Date(), 'The answer to life, the universe, and everything!');
			console.log('=== ', Date.now(), ' ===');
			Object.keys(_self.wl).forEach((market)=>{
				_self.wl[market].forEach((s)=>{
					_self.get(s).then((data)=>{
						_self.out.blue(data);
					}).catch((err)=>{
						console.error(err);
					});
				});
			});
		});
	}

	get(symbol): Promise {
		var _self = this;
		var options = {
	        	host: 'hq.sinajs.cn',
	        	path: '/list=' + symbol,
	        	// debug: true,
	        	encoding: 'GBK'
	        };
	    return new Promise(function(resolve, reject) {
	        myUtil.get(options, function(data, statusCode) {
	            if (statusCode !== 200) {
	                console.error('error occurred: ', statusCode);
	                reject({
	                    url: options.path,
	                    error: statusCode
	                });
	            }
	            
	            var result = _self.parse(data);
	            if(result) {
	            	resolve(result);
	            } else {
	            	reject({
	            		param: symbol,
	            		error: "parse failed"
	            	});
	            }
	        });
	    });
	}

	private parse(content): Object {
		var matches = /var hq_str_(sz|sh|hk)\d+="(.+)";/ig.exec(content);
		if(matches && matches.length > 1) {
			var items = matches[2].split(',');
			return {
				c: Number(items[4]),
				o: Number(items[3]),
				t: items.length > 31 ? items[31]: items[18]
			};
		}
		console.log(content);
		return null;
	}
}


var rp = new RP();
rp.start();
