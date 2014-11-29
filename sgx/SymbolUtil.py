#!/usr/bin/env python
# -*- coding: utf-8 -*-

import codecs
import sys
# import mymongo

class SymbolUtil:
    @staticmethod
    def getSSE():
        result = []
        market = None
        try:
            f=codecs.open('symbols.txt',mode='r')
            lines=f.readlines()
            for l in lines:
                splits = str.split(l,',')
                code = splits[0]
                name = splits[2].rstrip('\r\n')

                if code == "999999":
                    code = "000001.ss"
                    market = "SSE"
                elif code[0] == "6":
                    code = code + ".ss"
                    market = "SSE"
                else:
                    code = code + ".sz"
                    market = "SZSE"

                #print "%d. code: %s, name: %s" % (i, code, name.decode('gbk').encode('utf-8'))
                result.append({"_id": code, "name": name.decode('gbk').encode('utf-8'), "market": market })

            f.close()
        except Exception as e:
            print e
            sys.exit()

        return result

    @staticmethod
    def getSGX():
        result = []
        try:
            f=codecs.open('sgx-symbol.txt',mode='r')
            lines=f.readlines()
            for l in lines:
                splits = str.split(l,',')
                code = splits[0]
                name = splits[1][:-1]
                #print "%d. code: %s, name: %s" % (i, code, name)
                result.append({"_id": code, "name": name, "market": "SGX"})
            f.close()
        except Exception as e:
            print e
            sys.exit()

        return result


if __name__ == '__main__':

    # get & insert symbols
    #
    # symbols1 = SymbolUtil.getSSE() 
    symbols2 = SymbolUtil.getSGX()
    print symbols2

    # 1)
    # for symbol in symbols:
    #     collection.insert(symbol)

    # 2) insert batch
    # collection.insert(symbols)

    print 'done'
