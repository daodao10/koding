/// <reference path="../../node.d.ts" />

"use strict";
require('./ProtoUtil');

class GenSw{
	constructor(private allIdx: Object = require('./swi.json')){
	}

	genDlCommand():void {
		var dlCmds = this.allIdx.root.map((element)=>{
			return "wget -O ./swi-hid/{0}.xls --referer \"http://www.swsindex.com/idx0510.aspx\" \"http://www.swsindex.com/downloadfiles.aspx?swindexcode={0}&type=510&columnid=8890\"".format(element.SwIndexCode);
		});

		console.log(dlCmds.join('\n'));
	}

	genConvCmd():void{
		var cmds = this.allIdx.root.map((element)=>{
			return 'python ../html2csv.py ./swi-hid/{0}.xls'.format(element.SwIndexCode);
		});
		console.log(cmds.join('\n'));
	}

	genCounterList():void {
		var cls = this.allIdx.root.map((element)=>{
			return JSON.stringify({
				"c": element.SwIndexCode,
				"n": element.SwIndexName,
				"s": "INDEX"
			});
		});

		console.log(cls.join(',\n'));
	}

	genCodeArr():void{
		var arr = this.allIdx.root.map((element)=>{
			return element.SwIndexCode;
		});
		console.log(JSON.stringify(arr));
	}

	genIndexList():void{
		var cls = this.allIdx.root.map((element)=>{
			return '<a href="#{0}">{1}</a>'.format(element.SwIndexCode, element.SwIndexName);
		});
		console.log(cls.join('&nbsp;&nbsp;'));
	}
}

var gen = new GenSw();

// //=>swi.sh
// gen.genDlCommand();
// gen.genConvCmd();

// // helper
// gen.genCounterList();
// gen.genCodeArr();
// gen.genIndexList();
