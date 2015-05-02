# -*- coding: utf-8 -*-

from mymongo import MyMongo
import web_tools

if __name__ == "__main__":
    today = web_tools.today(utcDiff=-15)
    query = {"date": today}
    dbUri = web_tools.getDbUri(key="QuotesDbUri")
    client = MyMongo(dbName="quotes", dbUri = dbUri)

    print "-------today's data-------"
    rows = client.collection("tmc2gdp_day").find(query)
    for r in rows:
        print r

    print "-------historical data-------"
    query["date"] = web_tools.today()
    rows = client.collection("tmc2gdp_his").find(query)
    for r in rows:
        print r
