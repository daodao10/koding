# -*- coding: utf-8 -*-

import web_tools
import re
from mymongo import MyMongo


class GuruFocus:
    __ChartDataFormat = r"\{\s*animation:false,\s*name\s*:\s*'%s',\s*data\s*:(.+?\]\])"
    __ChartNames = { "GDP": "GDP", "TMC": "Wilshire Total Market", "TMC2GDP": "TMC\/GDP" }
    # __regTable = re.compile(r'<table class="at">(.*)</table>', re.S)
    __regTable = re.compile(r'Where are we today \((.*)\).* <td>(.*)</td>')
    __regToday = re.compile(r'<b>(\d{2}/\d{2}/\d{4})</b>')
    __regDesc = re.compile(r'As of today, the Total Market Index is at .+?(?=<p>)', re.S)

    def __init__(self, dbUri = None):
        self.__dbContext = MyMongo("quotes", dbUri)

    def fetch(self, url):
        content =  web_tools.get(url)

        if content:
            return content
        else:
            return None

    def parseData(self, content, regex):
        m = regex.search(content)
        if m:
            content = m.group(1)
            arr = eval(content)
            return arr

    def parseTmc2Gdp(self, content):
        desc = None
        table = None
        today = None
        
        m = self.__regDesc.search(content)
        if m:
            desc = m.group()
            desc = re.compile(r"([\r\n\t])").sub("", desc)# remove \t\r\n.
            desc = desc.rstrip()# remove right whitespaces

        m = self.__regTable.search(content)
        if m:
            table = m.group(1) + m.group(2).rstrip()
            if table:
                m = self.__regToday.search(table)
                if m:
                    today = web_tools.parseDate(m.group(1))

        if desc and table:
            return {"date": web_tools.strDate(today), "desc": desc, "table": table, "market": "US"}

    def saveTmc2GdpData(self, content, refresh = True):
        regex = re.compile(self.__ChartDataFormat % self.__ChartNames["TMC2GDP"])
        arr = self.parseData(content, regex)
        r = []
        for x in arr:
            r.append({"date": web_tools.strLocalDate(web_tools.getDateFromTimestamp(x[0]), utcDiff = -8), "value": x[1], "market": "US"})

        if len(r) > 0:
            # web_tools.debug(r[-1] if refresh else r)
            collection = self.__dbContext.collection("tmc2gdp_his")
            if refresh:
                collection.insert(r[-1])
            else:
                collection.insert(r)

    def saveTmc2GdpDaily(self, content):
        data = self.parseTmc2Gdp(content)
        if data:
            # web_tools.debug(data)
            collection = self.__dbContext.collection("tmc2gdp_day")
            collection.insert(data)

    def extractChartData(self, content, chartKey, refresh):
        '''
        refresh means get the latest one
        '''
        r = {}
        regex = re.compile(self.__ChartDataFormat % self.__ChartNames[chartKey])
        arr = self.parseData(content, regex)
        if refresh:
            x = arr[-1]
            r[web_tools.strLocalDate(web_tools.getDateFromTimestamp(x[0]), utcDiff = -8)] = x[1]
        else:
            for x in arr:
                r[web_tools.strLocalDate(web_tools.getDateFromTimestamp(x[0]), utcDiff = -8)] = x[1]

        return r

    def saveMarketValue(self, content, refresh = True):
        merged = []
        rows = []
        keys = self.__ChartNames.keys()

        for i in range(0, len(keys)): 
            rows.append(self.extractChartData(content, keys[i], refresh))

        for k in rows[0].keys():
            item = {"date": k}
            for x in range(0,len(keys)):
                item[keys[x]] = rows[x][k]
            merged.append(item)

        # sort
        merged.sort(key = lambda i: i["date"])

        collection = self.__dbContext.collection("MV_us")
        collection.insert(merged)

    def doWork(self):
        # get market valuations
        url = "http://www.gurufocus.com/stock-market-valuations.php"
        content = self.fetch(url)
        if content:
            # web_tools.save('content.txt', content) 

            # self.saveTmc2GdpDaily(content)

            # # first time set refresh = False
            # self.saveTmc2GdpData(content, True)

            self.saveMarketValue(content)
        else:
            print "empty"


if __name__ == "__main__":
    dbUri = web_tools.getDbUri(key="QuotesDbUri")
    GuruFocus(dbUri = dbUri).doWork()
