/// <reference path="../../node.d.ts" />

'use strict';
import {Colors} from './Colors';
require('./ProtoUtil');

var myUtil = require('./MyUtil'),
	nodemailer = require('nodemailer');

class WL {
	private out = new Colors();
	constructor(public schedule = require('node-schedule'), private wlist = require('./wl-sample.json'), private mailConfig = require('./mail-config.json')) {
	}

	start(): void {
		console.log('job start...');

		var _self = this, counter = 1;
		var j = _self.schedule.scheduleJob('*/1 * * * *', () => {
			// console.log(new Date(), 'The answer to life, the universe, and everything!');
			console.log('=== ', counter++, ' ===');
			Object.keys(_self.wlist).forEach((m) => {
				var market = _self.wlist[m];
				Object.keys(market).forEach((s) => {
					_self.get(s).then((data) => {
						var str = "{5}\t{4}\t{0}\t{1}\t[{2}, {3}]".format(data.c, data.r.toFixed(2), data.l, data.h, data.t, data.n);
						if (data.r > 0) {
							_self.out.red(str);
						} else if (data.r < 0) {
							_self.out.green(str);
						} else {
							console.log(str);
						}

						_self.alert(data, market[s]);
					}).catch((err) => {
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
			charset: 'GBK'
		};
		return new Promise(function (resolve, reject) {
			myUtil.request(options, function (data, statusCode) {
				if (statusCode !== 200) {
					console.error('error occurred: ', statusCode);
					reject({
						url: options.path,
						error: statusCode
					});
				}

				var result = _self.parse(data);
				if (result) {
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
		// var hq_str_sh600298="安琪酵母,17.770,17.760,17.710,17.920,17.680,17.770,17.780,4303599,76593626.000,22600,17.770,100,17.740,1500,17.710,8400,17.700,30000,17.690,8070,17.780,22100,17.790,18700,17.800,8150,17.810,7700,17.820,2016-08-30,15:00:00,00";
		// var hq_str_hk00665="HAITONG INT'L,海通国际,5.030,4.990,5.190,4.970,5.070,0.080,1.603,5.070,5.090,96790385,18970043,22.634,4.734,5.700,3.430,2016/08/30,16:09";

		var matches = /var hq_str_(sz|sh|hk)\d+="(.+)";/ig.exec(content);
		if (matches && matches.length > 1) {
			var items = matches[2].split(','), x;
			x = items.length > 31 ? {
				n: items[0],
				c: Number(items[3]),
				c1: Number(items[2]),
				h: Number(items[4]),
				l: Number(items[5]),
				t: items[31]
			} : {
					n: items[1],
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

	alert(data, watch): void {
		var _self = this, content = [];
		if (watch && watch.al) {
			var o = watch.al;
			if (data.c > o[2]) {
				content.push('rise above $ [{0}]'.format(o[2]));
			}
			if (data.c < o[0]) {
				content.push('fall below $ [{0}]'.format(o[0]));
			}
			if (data.r > o[3]) {
				content.push('rise above % [{0}]'.format(o[3]));
			}
			if (data.r < o[1]) {
				content.push('fall below % [{0}]'.format(o[1]));
			}

			if (content.length > 0) {
				content.unshift('{0} current $ [{1}]'.format(data.n, data.c));
				_self.send(content.join('<br/>'));
			}
		}
	}

	send(message): void {
		//https://nodemailer.com/2-0-0-beta/setup-smtp/

		var transporter = nodemailer.createTransport(this.mailConfig.smtp);
		var mailOptions = {
			from: this.mailConfig.from,
			to: this.mailConfig.to,
			subject: 'WL alert',
			//text: message
			html: message
		};

		transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				return console.log(error);
			}
			console.log('Message sent: ' + info.response);
		});
	}
}

var x = new WL();
x.start();
