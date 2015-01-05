#!/usr/bin/env python
# -*- coding: utf-8 -*-

import package
package.append_dir('../..')

from koding import web_tools
from koding.symbol import SymbolUtil
from ShareInvestor import ShareInvestor

import zipfile


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
        fileHandle = open(self.SourceDir + counter, 'rb')

        zf = zipfile.ZipFile(fileHandle)
        for name in zf.namelist():
            try:
                data = zf.read(name)
            except KeyError:
                print 'ERROR: did not find %s in zip file' % name
            else:
                web_tools.save(self.OutputDir + counter + ".csv", data)
                print counter, ' done'

        fileHandle.close()

    def process(self, counter):
        if self.download(counter):
            self.extract(counter)

if __name__ == "__main__":

    # cookies = ShareInvestor().refreshCookie()
    cookies = ShareInvestor.getPersistentCookie()
    # print cookies

    taUtil = TAUtil('./src/', './dest/', cookies)

    # # signle counter testing
    # #
    # counter = "Q1P.SI"
    # taUtil.process(counter)
    
    # batch process
    symbols = SymbolUtil.getSGX()
    for symbol in symbols:
        counter = symbol["_id"]
        taUtil.process(counter)
