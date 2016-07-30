# -*- coding: utf-8 -*-

import web_tools
import re
from mymongo import MyMongo


class GuruFocus:
    __MarketValueChartDataFormat = r"\{\s*animation:false,\s*name : '%s',\s*data :(.+)\};"
    __MarketValueChartNames = { "GDP": "GDP", "TMC": "Wilshire Total Market", "TMC2GDP": "TMC\/GDP" }
    __PeterLynchChartDataFormat = r"\{\s*animation:false,\s*lineWidth: 2,\s*name : '%s',\s*data :(.*)\};"
    __PeterLynchChartNames = { "p": "%s  Price", "pl": "%s Peter Lynch Earnings Line" }

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
        else:
            raise Exception("error occurs on the page")

    def extractChartData(self, content, regex, refresh):
        '''
        refresh means get the latest one
        '''
        r = {}
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
        keys = self.__MarketValueChartNames.keys()

        for i in range(0, len(keys)):
            chartName = self.__MarketValueChartNames[keys[i]]
            regex = re.compile(self.__MarketValueChartDataFormat % chartName)
            rows.append(self.extractChartData(content, regex, refresh))

        for k in rows[0].keys():
            item = {"date": k}
            for x in range(0,len(keys)):
                item[keys[x]] = rows[x][k]
            merged.append(item)

        # sort
        merged.sort(key = lambda i: i["date"])

        if refresh:
            r = merged[0]
            gdp1 = self.getGdp(r["date"], 1)
            gdp2 = self.getGdp(r["date"], 2)
            # print gdp1, gdp2

            r["TMC2GDP1"] = round(r["TMC"] / gdp1 * 100, 2)
            r["TMC2GDP2"] = round(r["TMC"] / gdp2 * 100, 2)

        print merged
        collection = self.__dbContext.collection("MV_us")
        collection.insert(merged)

    def doMarketValue(self):
        # get market valuations
        url = "http://www.gurufocus.com/stock-market-valuations.php"
        content = self.fetch(url)
        if content:
            self.saveMarketValue(content)
        else:
            print "empty"

    #https://research.stlouisfed.org/fred2/data/GDP.txt
    def getGdp(self, d, shift):
        if shift == 1: # use 1 quarter early data
            if d >= '20140701' and d < '20141001':
                return 17.3282; # 2014Q2
            elif d >= '20141001' and d < '20150101':
                return 17.5998; # 2014Q3
            elif d >= '20150101' and d < '20150401':
                return 17.7037; # 2014Q4
            elif d >= '20150401'and d < '20150701':
                return 17.6993; # 2015Q1
            elif d >= '20150701' and d < '20151001':
                return 17.9137; # 2015Q2
            elif d >= '20151001' and d < '20160101':
                return 18.0602; # 2015Q3
            elif d >='20160101' and d <'20160501':
                return 18.1648; # 2015Q4 -- need to update around 29 Jan, 2016
            elif d >='20160501' and d <'20160801':
                return 18.2211; # 2016Q1
            elif d >='20160801' and d <'20161101':
                return 18.4376; # 2016Q2
            else:
                return None
        else: # by default use 2 quarters early data
            if d >= '20140701' and d < '20141001':
                return 17.016; # 2014Q1
            elif d >= '20141001' and d < '20150101':
                return 17.3282; # 2014Q2
            elif d >= '20150101' and d < '20150401':
                return 17.5998; # 2014Q3
            elif d >= '20150401' and d < '20150701':
                return 17.7037; # 2014Q4
            elif d >= '20150701' and d < '20151001':
                return 17.6993; # 2015Q1
            elif d >= '20151001' and d < '20160101':
                return 17.9137; # 2015Q2
            elif d >= '20160101' and d < '20160401':
                return 18.0602; # 2015Q3
            elif d >= '20160401' and d < '20160701':
                return 18.1648; # 2015Q4
            elif d >= '20160701' and d < '20161001':
                return 18.2211; # 2016Q1
            else:
                return None


    def to_csv(self, rows):
        return 'Date,Value\n' + ''.join(["{0},{1}\n".format(k, rows[k]) 
            for k in sorted(rows)])

    def write_csv(self, filename, rows):
        with open(filename,'w') as f:
            f.write(self.to_csv(rows))

    def savePeterLynch(self, content, symbol, refresh = False):
        merged = []
        rows = []
        keys = self.__PeterLynchChartNames.keys()

        for i in range(0, len(keys)):
            chartName = self.__PeterLynchChartNames[keys[i]] % symbol
            regex = re.compile(self.__PeterLynchChartDataFormat % chartName)
            rows.append(self.extractChartData(content, regex, refresh)) 

        # # price
        self.write_csv(symbol + ".csv", rows[0])
        
        # # pl
        # self.write_csv(symbol + "_pl.csv", rows[1])    
        plRows = self.updateLastTradingDayOfMonth(rows)
        self.write_csv(symbol + "_pl.csv", plRows)

    def updateLastTradingDayOfMonth(self, rows):
        plRows = {}

        priceRows = sorted(rows[0])
        length = len(priceRows)
        j = 0

        for plk in sorted(rows[1]):
            valueDate = plk[:6]
            currentMonth = False
           
            for i in range(j, length):
                priceDate = priceRows[i][:6]
                if valueDate < priceDate:
                    if currentMonth:
                        j = i
                        plRows[priceRows[i - 1]] = rows[1][plk]
                    else:
                        plRows[plk] = rows[1][plk]
                    break
                elif valueDate == priceDate:
                    currentMonth = True

        return plRows

    def doPeterLynch(self, symbol):
        url = "http://www.gurufocus.com/modules/chart/peter_lynch.php?symbol=%s" % symbol
        content = self.fetch(url)
        if content:
            self.savePeterLynch(content, symbol)
        else:
            print "empty"

if __name__ == "__main__":
    dbUri = web_tools.getDbUri(key="QuotesDbUri")
    guru = GuruFocus(dbUri = dbUri)
    guru.doMarketValue()
    # guru.doPeterLynch("BIDU")
    # guru.doPeterLynch("AAPL")
