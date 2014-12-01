#!/usr/bin/env python
# -*- coding: utf-8 -*-

def append_dir(fpath):
    import os,sys
    parentDir = os.path.join(os.path.dirname(__file__), fpath)
    sys.path.append(parentDir);
    #print parentDir

append_dir('../..')
from koding import web_tools
from SymbolUtil import SymbolUtil
import re


class FAUtil():
    RegSection = re.compile(r'\$\("#(chart_financial_ratios|chart_profit_loss|chart_cash_flow)"\)\.data\("stack_data", (.*?)(?=</script>)', re.S)
    Urls ={
        "login": "https://www.shareinvestor.com/user/do_login.html",
        "fa-year":"http://www.shareinvestor.com/fundamental/financials.html?counter=%s&period=fy&cols=10",
        "fa-quarter": "http://www.shareinvestor.com/fundamental/financials.html?counter=%s&period=quarter&cols=10"
    }
    CookieFile = "shareinvestor.cookie"

    def __init__(self):
        self.__cookies = None

    def __redirectHandler(self, headers):
        self.__cookies = FAUtil.getCookie(headers["Set-Cookie"])

    def login(self, username, password, token):
        print "login..."
        postData = {
            "name": username,
            "password": "",
            "password_m":password,
            "authenticity_token": token,
            "redirect": "/sg",
            "utf-8": "✓",
            # "x_forwarded_for":"",
            # "remote_addr":"27.54.50.34"
        }

        headers = web_tools.getCredentials(FAUtil.Urls["login"], postData, lambda c: True, self.__redirectHandler, False)
        if headers:
            headers["Cookie"] = "country=sg;{0};{1};cookiecheck=1;".format(self.__cookies, FAUtil.getCookie(headers["Cookie"]))
            return headers
        else:
            return None

    @staticmethod
    def getCookie(cookieStr):
        dic = []
        if cookieStr:
            import Cookie
            cookies = Cookie.SimpleCookie(cookieStr) 
            for key in cookies:
                if key == 'si_user_profile' or key == 'si_user_pref' or key == 'forum_sso_token' or key == '_shareinvestor.com_session':
                    dic.append("{0}={1}".format(key, cookies[key].value))
        return ";".join(dic)

    @staticmethod
    def fetch(urlFormat, counter, headers):
        
        url = urlFormat % counter

        if not headers:
            headers = {
                'Cookie':'country=sg; \
                    _shareinvestor.com_session=BAh7B0kiD3Nlc3Npb25faWQGOgZFVEkiJTcyZmRjZjc3ZTU5ZWE5ZjJmMGFiNmQzN2JmM2Y3NGQ4BjsAVEkiEF9jc3JmX3Rva2VuBjsARkkiMTRUTW5iMXh6VmE4Zk50RWd3M1RLSUc0OFI5NWlaRFljanBzbkVWNk80SU09BjsARg%3D%3D--221784d9c14c41f935bee2ad2a00496efce6d8fb; \
                    si_user_profile=bWFjMjQ2NzI2ZTZhOTdmMWU4ZTllNDgwN2FkMDMxYjRkYzIzZjZhZWZjYmExNGRlN2Q2NTUzOGZhMWU1YmViMjljMcBJLIl8EXA5h0djrPW22yxZ3wZMEbx74ZK7nL99l9z3OMpe3RvDrn6iTrAL5pKEnQ5AWT6KetVsKtxCkjxQuoM8JpysCRGgsnrcc7Mh9pZ2kP16S28cjtpMVganR5i5qEfunt%2FIVveWPTN5v0C8956pYREEIX8IGmUdMB8ifBaKiGcEDvzxl%2FJ0KWAjjCCl4dwKgkwZR5DEBtI8onkDhz%2FOEIrgcJ4N40DRsiGNR5irMun848a1BJH1OGO28dSDHizh63enBnt%2B7zjZR7at1dA0hw5sLUFcKisIJBli9UmtYA%2FFckmzfP4FcOu4I%2BI8d7zm8b1UHe4b75Ro%2FedLjtROPhmZ9DgRX%2B58eWDEnNde7w4bZc%2FXTVuuIK9yd4%2F1Q6QR15xnnw2yeKpVQpLFFUIOTOyW%2FBQn3LbBi24hkLybxnePTE%2FwWJsyo91PIbELncuxAKRaIM%2FUuuECdJFJ0TXWZeYBWiecXccAA5DtcsgmGK%2BT8vQdAUeG%2F7uVUcttwqyT7d3wZIb3tTj1FIPh%2FFDI1PaW0yTVihm34VoyzF9f; \
                    si_user_pref=BAh7CToTcHJpbWFyeV9tYXJrZXQwOhtzdHJlYW1pbmdfdHJhZGluZ19kYXRhIgYwOhZjb29raWVfcGVyc2lzdGVudEY6EHN5bWJvbF9sYXN0SSIRRlNUQVM0MDAwLlNJBjoGRVQ%3D; \
                    forum_sso_token=RMXFYUDGWQP8HONA45ZL793J; cookiecheck=1;'
            }

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

    # import os
    # config = web_tools.getConfig(os.path.join(os.path.dirname(__file__), '../config.json'))
    # if config:
    #     config = config["shareInvestor"]
    #     if config:
    #         faUtil = FAUtil()
    #         cookies = faUtil.login(config["user"], config["pwd"], config["token"])
    #         if cookies:
    #             web_tools.save(FAUtil.CookieFile, cookies["Cookie"])

    #         # print config

    cookies = {"Cookie":web_tools.read(FAUtil.CookieFile)}
    # print cookies

    # # signle counter testing
    # #
    counter = "P8A.SI"
    content = FAUtil.fetch(FAUtil.Urls["fa-year"], counter, cookies)
    saved = FAUtil.saveFa(counter, content)
    if not saved:
        print FAUtil.saveSource(counter, content)
    else:
        print 'FA saved'


    # # get SGX fa data from share investor
    # #
    # symbols = SymbolUtil.getSGX()
    # for symbol in symbols:    
    #     counter = symbol["_id"]
    #     # print counter
    #     content = FAUtil.fetch(counter)

    #     saved = True #FAUtil.saveSource(counter, content)

    #     if saved:
    #         saved = FAUtil.saveFa(counter, content) and saved
    #         if saved:
    #             print '%s done' % counter
    #         else:
    #             print '%s failed to extract to txt' % counter
    #     else:
    #         print 'failed to get %s' % counter
