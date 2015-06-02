# -*- coding: utf-8 -*-

import web_tools
import re
from mymongo import MyMongo


class GuruFocus:
    __ChartDataFormat = r"\{\s*animation:false,\s*name : '%s',\s*data :(.+)\};"
    __ChartNames = { "GDP": "GDP", "TMC": "Wilshire Total Market", "TMC2GDP": "TMC\/GDP" }

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

        # print merged
        collection = self.__dbContext.collection("MV_us")
        collection.insert(merged)

    def doWork(self):
        # get market valuations
        url = "http://www.gurufocus.com/stock-market-valuations.php"
        content = self.fetch(url)
        if content:
            self.saveMarketValue(content)
        else:
            print "empty"


if __name__ == "__main__":
    dbUri = web_tools.getDbUri(key="QuotesDbUri")
    GuruFocus(dbUri = dbUri).doWork()
