#!/usr/bin/env python
# -*- coding: utf-8 -*-

import package
package.append_dir('../..')

from koding import web_tools
from koding.symbol import SymbolUtil
from ShareInvestor import ShareInvestor

import re


class FAUtil:
    RegSection = re.compile(r'\$\("#(chart_financial_ratios|chart_profit_loss|chart_cash_flow)"\)\.data\("stack_data", (.*?)(?=</script>)', re.S)
    
    @staticmethod
    def fetch(urlFormat, counter, headers):
        url = urlFormat % counter
        return web_tools.get(url, headers = headers)

    @staticmethod
    def saveSource(symbol, content):
        if content:
            web_tools.save("fa/%s.html" % symbol, content)
            return True
        return False

    @staticmethod
    def saveFa(symbol, content):
        result = []

        for m in FAUtil.RegSection.finditer(content):
            result.append(m.group())

        if len(result):
            web_tools.save("fa/%s.js" % symbol, ''.join(result))
            return True

        return False


if __name__ == "__main__":

    cookies = cookies = ShareInvestor.getPersistentCookie()
    # print cookies

    # # signle counter testing
    # #
    # counter = "P8A.SI"
    # content = FAUtil.fetch(ShareInvestor.Urls["fa-year"], counter, cookies)
    # saved = FAUtil.saveFa(counter, content)
    # if not saved:
    #     print FAUtil.saveSource(counter, content)
    # else:
    #     print 'FA saved'


    # get SGX fa data from share investor
    #
    symbols = SymbolUtil.getSGX()
    for symbol in symbols:    
        counter = symbol["_id"]
        print "%s,%s" % (counter,counter.replace('.SI',''))
        # content = FAUtil.fetch(counter)

        # saved = True #FAUtil.saveSource(counter, content)

        # if saved:
        #     saved = FAUtil.saveFa(counter, content) and saved
        #     if saved:
        #         print '%s done' % counter
        #     else:
        #         print '%s failed to extract to txt' % counter
        # else:
        #     print 'failed to get %s' % counter
