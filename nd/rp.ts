/// <reference path="../../node.d.ts" />

'use strict';
import {Colors} from './Colors';
var myUtil = require('./MyUtil'),
	nodemailer = require('nodemailer'),
	anounymous = require('./ProtoUtil');

class RP {
	private out = new Colors();
	constructor(public schedule = require('node-schedule'), private wl = require('./wl-sample.json')) {
		console.log('job start...');
	}

	start():void{
		var _self = this, counter = 1;
		var j = _self.schedule.scheduleJob('*/1 * * * *', ()=>{
			// console.log(new Date(), 'The answer to life, the universe, and everything!');
			console.log('=== ', counter++, ' ===');
			Object.keys(_self.wl).forEach((m)=>{
				var market = _self.wl[m];
				Object.keys(market).forEach((s)=>{
					_self.get(s).then((data)=>{
						var str = "{4}\t{0}\t{1}\t[{2}, {3}]".format(data.c,data.r.toFixed(2), data.l, data.h,data.t);
						if(data.r > 0){
							_self.out.red(str);
						} else if(data.r < 0) {
							_self.out.green(str);
						}else{
							console.log(str);
						}

						_self.alert(data, market[s]);
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
			var items = matches[2].split(','),x;
			x = items.length > 31 ? {
				c: Number(items[3]),
				c1: Number(items[2]),
				h: Number(items[4]),
				l: Number(items[5]),
				t: items[31]
			} : {
				c: Number(items[6]),
				c1: Number(items[3]),
				h: Number(items[4]),
				l: Number(items[5]),
				t: items[18] + ":00"
			};
			x.r = (x.c / x.c1 - 1) * 100;
			return x;
		}
		console.debug(content);
		return null;
	}

	alert(data, watch):void{
		var _self = this, content = [];
		if(watch && watch.al) {
			var o = watch.al;
			if(data.c > o[2]) {
				content.push('hit to target $ [{0}]'.format(o[2]));
			}
			if(data.c < o[0]) {
				content.push('fall to target $ [{0}]'.format(o[0]));
			}
			if(data.r > o[3]){
				content.push('hit to target % [{0}]'.format(o[3]));
			}
			if(data.r < o[1]){
				content.push('fall to target % [{0}]'.format(o[1]));
			}

			if(content.length > 0) {
				content.unshift('current $ [{0}]'.format(data.c));
				_self.send(content.join('<br/>'));
			}
		}
	}

	send(message):void{
		//https://nodemailer.com/2-0-0-beta/setup-smtp/
		var poolConfig = {
			host: 'smtp.sendgrid.net',
			port: 587,
			auth: {
				user: 'daodao@fortune.com',
				pass: 'pass'
			}
		};

		var transporter = nodemailer.createTransport(poolConfig);
		var mailOptions = {
			from: 'daodao <daodao@fortune.com>',
			to: 'xxx@fortune.com',
			subject: 'WL alert',
			//text: message
			html: message
		};

		transporter.sendMail(mailOptions, function(error, info){
			if(error){
				return console.log(error);
			}
			console.log('Message sent: ' + info.response);
		});
	}
}

var rp = new RP();
rp.start();
