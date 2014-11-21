# -*- coding: utf-8 -*-

import web_tools
import re
from mymongo import MyMongo


class GuruFocus:
    __regData = re.compile(r"(?<=\{animation:false,name:'TMC/GDP',data:).+?\]\]")
    __regTable = re.compile(r'<table class="at">(.*)</table>', re.S)
    __regDesc = re.compile(r'As of today, the Total Market Index is at .+?(?=<p>)', re.S)

    def __init__(self, dbUri = None):
        self.__dbContext = MyMongo("quotes", dbUri)

    def fetch(self, url):
        content =  web_tools.fetch(url)

        if content:
            return content
        else:
            return None

    def parseData(self, content):
        m = self.__regData.search(content)
        if m:
            content = m.group()
            arr = eval(content)
            return arr

    def parseTmc2Gdp(self, content):
        desc = None
        table = None
        
        m = self.__regDesc.search(content)
        if m:
            desc = m.group().replace('\n', '')
        
        m = self.__regTable.search(content)
        if m:
            table = m.group().replace('\n', '')

        if desc and table:
            return {"date": web_tools.today(utcDiff = -4), "desc": desc, "table": table, "market": "US"}

    def saveTmc2GdpData(self, content, refresh = True):
        arr = self.parseData(content)
        r = []
        for x in arr:
            r.append({"date": web_tools.strDate(web_tools.getDateFromTimestamp(x[0])), "value": x[1], "market": "US"})

        if len(r) > 0:
            collection = self.__dbContext.collection("tmc2gdp_his")
            if refresh:
                collection.insert(r[-1])
            else:
                collection.insert(r)

    def saveTmc2GdpDaily(self, content):
        data = self.parseTmc2Gdp(content)
        if data:
            collection = self.__dbContext.collection("tmc2gdp_day")
            collection.insert(data)

    def doWork(self):
        # get market valuations
        url = "http://www.gurufocus.com/stock-market-valuations.php"
        content = self.fetch(url)
        
        if content:
            self.saveTmc2GdpDaily(content)

            # first time set refresh = False
            self.saveTmc2GdpData(content, True)
        else:
            print "empty"
            

if __name__ == "__main__":
    dbUri = web_tools.getDbUri()
    GuruFocus(dbUri = dbUri).doWork()
