import fs from 'fs'

import data from './data.json'

function _save(filePath, content) {
    fs.writeFile(filePath, content, function (err) {
        if (err) {
            throw err;
        }
        console.log('saved.');
    });
}

function transfer() {
    if (data && data.size > 0) {
        let arr = []
        data.companies.forEach((element, idx) => {
            arr.push(`{"index":{"_id":"${idx + 1}"}}`)
            arr.push(JSON.stringify(element))
        });

        if (arr.length > 0) {
            _save('./data_es.json', arr.join('\n'))
        }
    }
}

function getNotDataSymbols() {
    if (data && data.size > 0) {

        let arr = []
        data.companies.forEach((element, idx) => {
            let code = element.tickerCode
            if (!fs.existsSync(`../sg/src-hid/${code}.SI`))
                arr.push(`${code}.SI,${code}`)
        });

        if (arr.length > 0) {
            console.log(arr.join('\n'))
        }
    }
}

// transfer()

getNotDataSymbols()
