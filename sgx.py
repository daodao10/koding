# -*- coding: utf-8 -*-

import web_tools
from mymongo import MyMongo

import json
import re


class SGX:
    def __init__(self, dbUri = None, today = None):
        self.__regSummary = re.compile(r'<div class="noMarginText">(.*?)</div>', re.S)
        self.__today = today
        self.__dbContext = MyMongo("quotes", dbUri)
        
    def getSummary(self):
        url = "http://sgx.com/wps/portal/sgxweb/home/marketinfo/market_summary"
        content = web_tools.get(url)
        if content:
            m = self.__regSummary.search(content)
            if m:
                content = m.group(0).replace('\n', '')
                timestamp = web_tools.today() if not self.__today else self.__today
                # print { "date": timestamp, "summary": content, "market": "SGX"}
                dbCollection = self.__dbContext.collection("summary")
                dbCollection.insert({ "date": timestamp, "summary": content, "market": "SGX"})
            else:
                print "occurs error when get SGX market summary"
        else:
             print "empty"

    def getDayTick(self):
        url = "http://www.sgx.com/JsonRead/JsonData?qryId=RStock&timeout=30&%20noCache=1409062326197.193901.9152537007"
        content = web_tools.get(url)

        # json format
        content = re.sub(r"([A-Za-z_]+[0-9]*[A-Za-z_]*):", r'"\1":', re.sub("[']", '"', content[5:]))
        if content:
            #print content
            data = json.loads(content)
        
            # get trading date
            label = data["label"]
            trading_day = "%s%s%s" % (label[12:16],label[9:11],label[6:8])
    
            j = []
            for item in data["items"]:
                j.append({"code": item["NC"] + ".SI", "date": trading_day, "price": item["LT"], "chg": item["C"], "volumn": item["VL"], "market": "SGX" })
                
            # print j[0]["code"]
            dayCollection = self.__dbContext.collection("day")
            dayCollection.insert(j)
        
        else:
            print 'empty'

