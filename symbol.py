#!/usr/bin/env python
# -*- coding: utf-8 -*-

import codecs
import sys
from mymongo import MyMongo
import web_tools

class SymbolUtil:
    @staticmethod
    def getSSE():
        result = []
        market = None
        try:
            f = codecs.open('./chart/s/cn.txt', 'r', 'utf-8')
            lines = f.readlines()
            for l in lines:
                splits = l.split(',')
                code = splits[1]
                name = splits[2]
                sector = splits[3].rstrip('\r\n')
                
                if splits[0].startswith( 'SH' ):
                    market = "SSE"
                else:
                    market = "SZSE"

                #print "%d. code: %s, name: %s" % (i, code, name.decode('gbk').encode('utf-8'))
                # result.append({"_id": code, "name": name.decode('gbk').encode('utf-8'), "market": market })
                result.append({"_id": code, "name": name, "sector":sector, "market": market })

            f.close()
        except Exception as e:
            print e
            sys.exit()

        return result

    @staticmethod
    def getSGX():
        result = []
        try:
            f=codecs.open('./chart/s/sg_shareinvestor.txt',mode='r')
            lines=f.readlines()
            for l in lines:
                splits = str.split(l,',')
                code = splits[0]
                name = splits[2]
                sector = splits[3].rstrip('\r\n')
                #print "%d. code: %s, name: %s" % (i, code, name)
                result.append({"_id": code, "name": name, "sector": sector, "market": "SGX"})
            f.close()
        except Exception as e:
            print e
            sys.exit()

        return result


if __name__ == '__main__':
    # dbContext = MyMongo("quotes", web_tools.getDbUri(key="QuotesDbUri"))

    symbols = SymbolUtil.getSSE()
    # symbols = SymbolUtil.getSGX()
    # batch insert
    # dbContext.collection("symbol").insert(symbols)
    with codecs.open('cn.txt', 'wb', 'utf-8') as f:
        for symbol in symbols:
            f.write("%s,%s,%s,%s\n" % (symbol["_id"], symbol["_id"], symbol["name"], symbol["sector"]))
            # collection.insert(symbol)

    print 'done'
