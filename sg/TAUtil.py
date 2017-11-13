#!/usr/bin/env python
# -*- coding: utf-8 -*-

import package
package.append_dir('../..')

from koding import web_tools
from koding.symbol import SymbolUtil
from ShareInvestor import ShareInvestor

import zipfile
import os
import codecs


class TAUtil:
    def __init__(self, srcDir, destDir, cookies):
        self.SourceDir = srcDir
        self.OutputDir = destDir
        self.Cookies = cookies

    #@staticmethod
    def download(self, counter):
        url = ShareInvestor.Urls["price-download"] % counter
        return web_tools.download(url, headers = self.Cookies, fileName = self.SourceDir + counter)

    #@staticmethod
    def extract(self, counter):
        fileName = self.SourceDir + counter
        if os.path.exists(fileName):
            fileHandle = open(fileName, 'rb')

            zf = zipfile.ZipFile(fileHandle)
            for name in zf.namelist():
                try:
                    data = zf.read(name)
                except KeyError:
                    print('ERROR: did not find %s in zip file' % name)
                else:
                    web_tools.save(self.OutputDir + counter + ".csv", data)
                    print(counter, ' done')

            fileHandle.close()

    def process(self, counter):
        if self.download(counter):
            self.extract(counter)

    @staticmethod
    def get_symbols(symbolFile):
        symbolList = []
        try:
            f = codecs.open(symbolFile, mode='r')
            lines = f.readlines()
            lines.pop(0)
            for l in lines:
                splits = str.split(l, ',')
                if len(splits) > 0:
                    symbolList.append(splits[0])
            f.close()
        except Exception as e:
            print(e)
            sys.exit()

        return symbolList

if __name__ == "__main__":

    # cookies = ShareInvestor().refreshCookie()
    cookies = ShareInvestor.getPersistentCookie()
    # print(cookies)

    taUtil = TAUtil('./src-hid/', './dest-hid/', cookies)

    # # signle counter testing
    # #
    # counter = "BVP.SI"
    # taUtil.process(counter)
    
    # batch process
    # # 1)
    # symbols = SymbolUtil.getSGX()
    # for symbol in symbols:[23:]:#security symbol starts from line 23
    #     counter = symbol["_id"]
    #     taUtil.process(counter)

    # 2)
    symbols = TAUtil.get_symbols('../chart/s/sg_shareinvestor.txt')
    for counter in symbols[22:]:
    # symbols = TAUtil.get_symbols('../chart/s/hk_shareinvestor.txt')
    # for counter in symbols:
        taUtil.process(counter)
