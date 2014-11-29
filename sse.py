# -*- coding: utf-8 -*-

import web_tools
from mymongo import MyMongo

import json

class SSE:
    def __init__(self, dbUri = None, today = None):
        self.__dbUri = dbUri
        self.__today = today

    def getDayTick(self):
        # EXCHANGE - SH or SZ
        Market_Data_URL = 'http://quotes.money.163.com/hs/service/diyrank.php?query=STYPE:EQA;EXCHANGE:CNSE{0}&fields=SYMBOL,SNAME,PRICE,OPEN,HIGH,LOW,UPDOWN,VOLUME&sort=SYMBOL&order=asc&page={1}&count={2}&type=query'
        exchanges = ['SH', 'SZ']
        page_size = 300
        for exchange in exchanges:

            rows = [] 
            page_index = 0
            postfix = '.ss'
            if exchange == 'SZ':
                postfix = ".sz"
            while page_index < 10:
                content = web_tools.get(Market_Data_URL.format(exchange,page_index, page_size))
                json_data = json.loads(content)

                if json_data and len(json_data['list']) > 0:
                    trading_day = json_data["time"][:10].replace("-", "") if not self.__today else self.__today
                    for l in json_data['list']:
                        if l['HIGH'] == 0:
                            print 'ignore stock %s on non-trading day' % l['SYMBOL']
                            continue

                        rows.append({"code": l['SYMBOL'] + postfix, "date": trading_day, "price": l['PRICE'], "chg": l["UPDOWN"], "volumn": l['VOLUME'], "market": exchange})
                    
                    page_index += 1
                else:
                    break

            if len(rows) > 0:
                dbContext = MyMongo("quotes", self.__dbUri)
                dayCollection = dbContext.collection("day")
                dayCollection.insert(rows)

            print 'done for exchange[%s], has %d pages' % (exchange, page_index)
