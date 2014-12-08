#!/usr/bin/env python
# -*- coding: utf-8 -*-

import package
package.append_dir('../..')

from koding import web_tools
from SymbolUtil import SymbolUtil
from ShareInvestor import ShareInvestor

class TAUtil():
    @staticmethod
    def download(counter, cookies):
        url = ShareInvestor.Urls["price-download"] % counter
        filename = counter.replace('.SI','') + ".csv"
        return web_tools.download(url, headers=cookies)
        
if __name__ == "__main__":

    cookies = cookies = ShareInvestor.getPersistentCookie()
    # print cookies

    # # signle counter testing
    # #
    counter = "P8A.SI"
    print TAUtil.download(counter, cookies)
