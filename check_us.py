# -*- coding: utf-8 -*-

from mymongo import MyMongo
import web_tools

if __name__ == "__main__":
    today = web_tools.today(utcDiff=-12)
    query = {"date": today}
    dbUri = web_tools.getDbUri()
    client = MyMongo(dbName="quotes", dbUri = dbUri)
    rows = client.collection("tmc2gdp_his").find(query)
    for r in rows:
        print r
    rows = client.collection("tmc2gdp_day").find(query)
    for r in rows:
        print r

