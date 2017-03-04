#!/usr/bin/env python
# -*- coding: utf-8 -*-

if __name__ == "__main__":
    import package
    package.append_dir('../..')

from koding import web_tools


class ShareInvestor:
    __CookieFile = "shareinvestor.cookie"
    Urls ={
        "login": "https://www.shareinvestor.com/user/do_login.html",
        "fa-year":"http://www.shareinvestor.com/fundamental/financials.html?counter=%s&period=fy&cols=10",
        "fa-quarter": "http://www.shareinvestor.com/fundamental/financials.html?counter=%s&period=quarter&cols=10",
        "price-download":"https://www.shareinvestor.com/prices/price_download_zip_file.zip?type=historical&counter=%s"
    }

    def __init__(self):
        self.__cookies = None

    def __redirectHandler(self, headers):
        self.__cookies = ShareInvestor.__getCookie(headers["Set-Cookie"])

    def __login(self, username, password, token):
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

        headers = web_tools.getCredentials(ShareInvestor.Urls["login"], postData, lambda c: True, self.__redirectHandler, False)
        if headers:
            headers["Cookie"] = "country=sg;{0};{1};cookiecheck=1;".format(self.__cookies, ShareInvestor.__getCookie(headers["Cookie"]))
            return headers
        else:
            return None

    @staticmethod
    def __getCookie(cookieStr):
        dic = []
        if cookieStr:
            import Cookie
            cookies = Cookie.SimpleCookie(cookieStr) 
            for key in cookies:
                if key == 'si_user_profile' or key == 'si_user_pref' or key == 'forum_sso_token' or key == '_shareinvestor.com_session':
                    dic.append("{0}={1}".format(key, cookies[key].value))
        return ";".join(dic)


    def refreshCookie(self):
        import os
        config = web_tools.getConfig(os.path.join(os.path.dirname(__file__), '../config.json'))
        if config:
            config = config["ShareInvestor"]
            if config:
                headers = self.__login(config["user"], config["pwd"], config["token"])
                if headers and headers.has_key("Cookie"):
                    web_tools.save(ShareInvestor.__CookieFile, headers["Cookie"])
                    return ShareInvestor.getPersistentCookie()

    @staticmethod
    def getPersistentCookie():
        return {"Cookie":web_tools.read(ShareInvestor.__CookieFile)}


if __name__ == "__main__":
    
    # 1)
    # si = ShareInvestor()
    # cookies = si.refreshCookie()

    # 2)
    cookies = ShareInvestor.getPersistentCookie()

    print cookies
