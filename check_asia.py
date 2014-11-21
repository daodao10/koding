# -*- coding: utf-8 -*-

from mymongo import MyMongo
import web_tools

if __name__ == "__main__":
    today = web_tools.today()
    query = {"date": today}
    
    dbUri = web_tools.getDbUri()
    client = MyMongo(dbName="quotes", dbUri = dbUri)
    
    print "market share: %d" % client.collection("day").find(query).count()
    rows = client.collection("summary").find(query)
    for r in rows:
        print r
