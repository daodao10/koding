#!/usr/bin/python
import sys
import sgx, sse, web_tools

def main():
    #today = None
    today = web_tools.today(utcDiff = -4)
    dbUri = web_tools.getDbUri(key="DayDbUri")

    args = sys.argv
    if len(args) == 2:
        if args[1] == 'sg':
            process4SG(dbUri, today)
        elif args[1] == 'cn':
            process4CN(dbUri, today)
        else:
            help()
    else:
        help()

def help():
    print ('USAGE: python asia.py [cn|sg]')

def process4SG(dbUri, today):
    print ('processing for SG')
    # comment out day data of sgx counters
    # s = sgx.SGX(dbUri = dbUri, today = today)
    # s.getDayTick()

    s = sgx.SGX(dbUri = web_tools.getDbUri(key="QuotesDbUri"), today = today)
    s.getSummary()

def process4CN(dbUri, today):
    print ('processing for China')
    s = sse.SSE(dbUri = dbUri, today = today)
    s.getDayTick()


if __name__ == '__main__':
    main()
