#!/usr/bin/env python
# -*- coding: utf-8 -*-

import package
package.append_dir('../..')

from koding import web_tools
from SymbolUtil import SymbolUtil
from ShareInvestor import ShareInvestor

class TAUtil:
    @staticmethod
    def download(counter, cookies):
        url = ShareInvestor.Urls["price-download"] % counter
        filename = counter.replace('.SI','') + ".csv"
        return web_tools.download(url, headers=cookies)


if __name__ == "__main__":

    # cookies = ShareInvestor().refreshCookie()
    cookies = ShareInvestor.getPersistentCookie()
    # print cookies

    # signle counter testing
    #
    counter = "Q1P.SI"
    zipFileName = TAUtil.download(counter, cookies)
    
    if zipFileName:
        import zipfile
        fileHandle = open(zipFileName, 'rb')

        zf = zipfile.ZipFile(fileHandle)
        for name in zf.namelist():
            try:
                data = zf.read(name)
            except KeyError:
                print 'ERROR: did not find %s in zip file' % name
            else:
                print name, ':'
                print data

        fileHandle.close() 
