# -*- coding: utf-8 -*-

import sys
from mymongo import MyMongo
import web_tools

if __name__ == "__main__":
    # today = "20150528"
    args = sys.argv
    if len(args) == 2:
        today = args[1]
    else:
        today = web_tools.today(utcDiff=-15)
   
    query = {"_id": today}
    dbUri = web_tools.getDbUri(key="DbUri")
    client = MyMongo(dbName="test", dbUri = dbUri)

    # print "-------today's data-------"
    # rows = client.collection("tmc2gdp_day").find(query)
    # for r in rows:
    #     print r

    # print "-------historical data-------"
    # rows = client.collection("tmc2gdp_his").find(query)
    # for r in rows:
    #     print r

    print "-------today's market value data-------"
    rows = client.collection("MV_us").find(query)
    for r in rows:
        print r

    print "-------today's new-high/new-low data-------"
    query = {"d": today}
    rows = client.collection("nhnl").find(query)
    for r in rows:
        print r

    query = {"_id": today}
    rows = client.collection("nhnl_sum").find(query)
    for r in rows:
        print r
