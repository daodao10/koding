/// <reference path="../../lib.es6.d.ts" />

import myUtil = require('./MyUtil');

export interface Settings {
    UrlPath: string,
    FilePath: string,
    PatchFile?: string
}

export class Util {
    setting: Settings;
    constructor(setting: Settings) {
        this.setting = setting;
    }

    get(startRowIndex): Promise<any> {
        let url: string = this.setting.UrlPath.format(startRowIndex);
        return (new Promise(function (resolve, reject) {
            myUtil.request({
                host: 'finviz.com',
                secure: true,
                port: 443,
                path: url,
                headers: {
                    "Cookie": "customTable=1,2,3,4,7,9,10,11,13,19,32,33,52,53,54,59,66,67,24;"
                },
            }, function (data, statusCode) {
                if (statusCode !== 200) {
                    console.error('error occurred: ', statusCode);
                    reject({
                        page: url,
                        error: statusCode
                    });
                }

                resolve(data);
            });
        })
            // .catch((err) => {
            //     // console.error(err);
            //     throw err;
            // })
        );
    }
}
