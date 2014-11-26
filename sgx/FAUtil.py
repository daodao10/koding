#!/usr/bin/env python
# -*- coding: utf-8 -*-

import web_tools
import re


class FAUtil():
    regSection = re.compile(r'\$\("#chart_financial_ratios"\)\.data\("stack_data", (.*?)(?=</script>)', re.S)

    @staticmethod
    def fetch(counter):
        #url = http://www.shareinvestor.com/fundamental/financials.html?counter=S53.SI&period=quarter&cols=2
        url = "http://www.shareinvestor.com/fundamental/financials.html?counter=%s&period=fy&cols=10" % counter
        # url = "http://www.shareinvestor.com/fundamental/factsheet.html?counter=" + counter

        headers = {
            'Cookie':'country=sg; \
                _shareinvestor.com_session=BAh7B0kiD3Nlc3Npb25faWQGOgZFVEkiJTU2YzRlMWI3Y2Y0MTEzNWU0ODgxYTliNmRjYzRkMzdlBjsAVEkiEF9jc3JmX3Rva2VuBjsARkkiMUZpMUx3Nk9EZHpmdS9sN2JnQWV1ZndzbDhWbmFzOVR1RUpUbTY1NDNFbFk9BjsARg%3D%3D--522eafb909206f36a664cf773781c8c59a13c21f; \
                si_user_profile=bWFjOTJmNjcyMTBhZTNmNjgwZjc5YTU0MjRmNTMzNTZmZDY0NDFkMzM0ODhjZDE5YzVkZWVlNmYwMTI1MThiMTg2M5dUYxRpoY43D84E7zjBaQNOEXdeLgWQ95Q0uHuEedITDqFVncKN6qCtThOOs%2BzYoTDmxS3a6phEUowKFh83BJ%2FL%2BP60PkZea%2B8Atn0ymnaGbf%2FUXaXNHgWluYwknwNmHrP5g4%2FdSGLRsNtK5txVVCXf8r%2B66uQf%2FFWW4%2BNgnkbJtLCc4oREEduGRuQAnN%2Bpz8kj841z6%2FyEfy0sKnY8NjxTRpfAndgFjUDUZPllCdYZbrnbsvXvRzyYA3i76wqLrAKxllyUnmFpF%2BfihB%2BEsylcyT9jtZqvCYKRkIkog6HEdUnXPtqytC2%2FJK%2FS2Ceg1OAow33wo%2FSRcbNs0w9YiIPeaI7jGhhyXnjLXAqWlqt%2F9yX2oCzKufZz33WVkhw6rIIuG256zc59FftlV%2BI2YzNbVwS4RYQ9ykDnfrWBwwIktwD09uGVsjSbWWLOsMEJtn3ki%2FoDIJwvM1geXkrg%2BmqBiZozbqq5aYDt5scyUyKzC7JI%2FIRVJUn6jgb5Wqf8pQ%3D%3D; \
                si_user_pref=BAh7CToTcHJpbWFyeV9tYXJrZXQwOhtzdHJlYW1pbmdfdHJhZGluZ19kYXRhIgYwOhZjb29raWVfcGVyc2lzdGVudEY6EHN5bWJvbF9sYXN0SSILUzUzLlNJBjoGRVQ%3D; \
                forum_sso_token=X583NWKR26QJPH7GC9B4SALE; cookiecheck=1;'
        }

        return web_tools.fetch(url, headers)

    @staticmethod
    def saveSource(symbol, content):
        if content:
            web_tools.save("fa/%s.html" % symbol, content)
            return True
        return False

    @staticmethod
    def saveFa(symbol, content):
        m = FAUtil.regSection.search(content)
        if m:
            content = m.group(0).rstrip()
            web_tools.save("fa/%s.txt" % symbol, content)
            return True
        return False


# signle counter testing
#
# counter = "S68.SI"
# content = fetch(counter)
# # print len(content)
# saveFa(counter, content)


# get SGX fa data from share investor
#
# symbols = getSymbols_SGX()
# for symbol in symbols:    
#     counter = symbol["_id"]
#     content = fetch(counter)

#     saved = saveSource(counter, content)

#     if saved:
#         saved = saveFa(counter, content) and saved
#         if saved:
#             print '%s done' % counter
#         else:
#             print '%s failed to extract to txt' % counter
#     else:
#         print '%s nothing' % counter
