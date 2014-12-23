#!/usr/bin/python
import sys
import sgx, sse, web_tools

def main():
    today = None
    # today = web_tools.today(utcDiff = +4)
    dbUri = web_tools.getDbUri()

    args = sys.argv
    if len(args) == 2:
        if args[1] == 'sg':
            process4SG(dbUri, today)
        elif args[1] == 'cn':
            process4CN(dbUri, today)
        else:
            process4SG(dbUri, today)
            process4CN(dbUri, today)
    else:
        print 'USAGE: python asia.py [cn|sg]'

def process4SG(dbUri, today):
    print 'processing for SG'
    s = sgx.SGX(dbUri = dbUri, today = today)
    s.getSummary()
    s.getDayTick()

def process4CN(dbUri, today):
    print 'processing for China'
    s = sse.SSE(dbUri = dbUri, today = today)
    s.getDayTick()


if __name__ == '__main__':
    main()
