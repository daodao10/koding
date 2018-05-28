# -*- coding: utf-8 -*-

from pymongo import MongoClient

class MyMongo:
    
    __db = None

    def __init__(self, dbName, dbUri = None):
        if dbName:
            # 1)
            dbUri = (dbUri + dbName) if dbUri else "mongodb://localhost:27017/"
            # dbUri = "mongodb://user:pwd@host:port/" + dbName
            client = MongoClient(dbUri)
            db = client[dbName]
            
            # 2)
            # client = MongoClient("host", port)
            # db = client[dbName]
            # db.authenticate("user", "pwd")
        else:
            raise SomeError("dbName required")

        self.__db = db

    def collection(self, collectionName):
        if self.__db:
            return self.__db[collectionName]

        return None
    
