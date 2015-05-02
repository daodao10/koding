# -*- coding: utf-8 -*-

from mymongo import MyMongo
import web_tools

if __name__ == "__main__":
    today = web_tools.today(utcDiff = -4)
    
    emDbUri = web_tools.getDbUri(key='EMDbUri')
    client = MyMongo(dbName="em", dbUri = emDbUri)

    query = {"d": today}
    print "market comment: %d" % client.collection("test").find(query).count()


    query = {"date": today}

    client = MyMongo(dbName="quotes", dbUri = web_tools.getDbUri(key='DayDbUri'))
    print "market share: %d" % client.collection("day").find(query).count()


    client = MyMongo(dbName="quotes", dbUri = web_tools.getDbUri(key='QuotesDbUri'))
    rows = client.collection("summary").find(query)
    for r in rows:
        print r['summary'][0:250]
