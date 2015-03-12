# -*- coding: utf-8 -*-

from mymongo import MyMongo
import web_tools

if __name__ == "__main__":
    today = web_tools.today(utcDiff = -4)
    
    dbUri = web_tools.getDbUri('./nd/config.json')
    client = MyMongo(dbName="em", dbUri = dbUri)

    query = {"d": today}
    print "market comment: %d" % client.collection("test").find(query).count()


    dbUri = web_tools.getDbUri()
    client = MyMongo(dbName="quotes", dbUri = dbUri)
    query = {"date": today}
    
    print "market share: %d" % client.collection("day").find(query).count()
    rows = client.collection("summary").find(query)
    for r in rows:
        print r['summary'][0:250]
