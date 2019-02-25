#!/usr/bin/env python
# -*- coding: utf-8 -*-

import package
package.append_dir('../..')

from koding import web_tools
from koding.symbol import SymbolUtil
from ShareInvestor import ShareInvestor

import zipfile
import os, sys
import codecs
import time
import random


class TAUtil:
    def __init__(self, srcDir, destDir, cookies):
        self.SourceDir = srcDir
        self.OutputDir = destDir
        self.Cookies = cookies

    #@staticmethod
    def download(self, counter):
        url = ShareInvestor.Urls["price-download"] % counter
        return web_tools.download(url, headers=self.Cookies, fileName=self.SourceDir + counter)

    #@staticmethod
    def extract(self, counter):
        fileName = self.SourceDir + counter
        if os.path.exists(fileName):
            fileHandle = open(fileName, 'rb')

            try:
                zf = zipfile.ZipFile(fileHandle)
                for name in zf.namelist():
                    try:
                        data = zf.read(name)
                    except KeyError:
                        print('ERROR: did not find %s in zip file' % name)
                    except:
                        print('%s file' % name)
                        print("Unexpected error: ", sys.exc_info()[0])
                    else:
                        web_tools.save(self.OutputDir + counter + ".csv", data)
                        print(counter, ' done')
            except zipfile.BadZipfile:
                print('ERROR: bad zip file %s' % fileName)

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

    cookies = ShareInvestor().refreshCookie()
    # cookies = ShareInvestor.getPersistentCookie()
    # print(cookies)

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

    # # 2) anti spider
    symbols = TAUtil.get_symbols('../chart/s/sg_shareinvestor.txt')
    for counter in symbols[22:]:
    # symbols = TAUtil.get_symbols('../chart/s/hk_shareinvestor.txt')
    # for counter in symbols:
        taUtil.process(counter)

    # # 3) patch: -rw-r--r--  1 dao  staff\s*\d+ Jan 22 12:25\s+(\w+)_d\.js
    # symbols = []
    # for counter in symbols:
    #     taUtil.process(counter)
