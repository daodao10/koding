# -*- coding: utf-8 -*-

import contextlib
import traceback

import urllib2, urllib, httplib

import gzip
from StringIO import StringIO

from datetime import datetime, timedelta
import json
# from ConfigParser import ConfigParser

def post(url, data = None, headers = None):
    try:
        newHeaders = buildHeader(headers)
        request = None
        if data:
            request = urllib2.Request(url, urllib.urlencode(data), newHeaders)
        else:
            request = urllib2.Request(url= url, headers = newHeaders)

        with contextlib.closing(urllib2.urlopen(request)) as response:
                # getServerCookie(response.info())
                if response.info().get('Content-Encoding') == 'gzip':
                    buffer = StringIO( response.read())
                    deflatedContent = gzip.GzipFile(fileobj=buffer)
                    return deflatedContent.read()
                else:
                    return response.read()

    except urllib2.HTTPError as e:
        print('HTTPError = ' + str(e.code))

    except urllib2.URLError as e:
        print('URLError = ' + str(e.reason))

    except httplib.HTTPException as e:
        print('HTTPException')

    except Exception:
        print('generic exception: ' + traceback.format_exc())

def get(url, data = None, headers = None):
    try:
        newHeaders = buildHeader(headers)
        if data:
            url = "%s?%s" % (url, urllib.urlencode(data))

        request = urllib2.Request(url, headers = newHeaders)
        with contextlib.closing(urllib2.urlopen(request)) as response:
            # getServerCookie(response.info())
            if response.info().get('Content-Encoding') == 'gzip':
                buffer = StringIO( response.read())
                deflatedContent = gzip.GzipFile(fileobj=buffer)
                return deflatedContent.read()
            else:
                return response.read()

    except urllib2.HTTPError as e:
        print('HTTPError = ' + str(e.code))

    except urllib2.URLError as e:
        print('URLError = ' + str(e.reason))

    except httplib.HTTPException as e:
        print('HTTPException')

    except Exception:
        print('generic exception: ' + traceback.format_exc())

def getCredentials(loginUrl, data, callback, debug = False):
    data = urllib.urlencode(data)
    headers = buildHeader({
        "Content-Length": len(data),
        "Content-Type": "application/x-www-form-urlencoded"
    })
    request = urllib2.Request(loginUrl, data, headers)
    with contextlib.closing(urllib2.urlopen(request)) as response:
        if debug:
            print loginUrl
            print data
            print headers
            print response.info()
            # print response.read()
        cookie = getServerCookie(response.info())
        if cookie:
            content = response.read()
            if callback(content):
                print "done"
                return cookie

    print "failed"
    return None

def buildHeader(headers):
    default_headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.57 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.6,en;q=0.4,zh-TW;q=0.2',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip,deflate,sdch'
    }
    if headers:
        for k, v in headers.iteritems():
            default_headers[k] = v

    return default_headers

def fetch(url, headers = None):
    """
    like web-get, supports cookie & gzip
    cookie: {'Cookie':'cookie-name:cookie-value;'}
    """
    return get(url, data = None, headers = headers)

def getServerCookie(info):
    if info:
        # print info
        if info.has_key('Set-Cookie'):
            cookie = {"Cookie":info["Set-Cookie"]}
            # print info['Set-Cookie']
            return cookie
    return None

def read(filename):
    with file(filename, 'rb') as f:
        return f.read()

def readlines(filename):
    with open(filename, mode = "r") as f:
        return f.readlines()

def save(filename, content):
    oFile = file(filename, 'wb')
    oFile.write(content)
    oFile.close()

def decompress(zipFile):
    iFile = gzip.GzipFile(zipFile, 'rb')
    content = iFile.read()
    iFile.close()
    return content


def today(format = None, utcDiff = +8):
    return strLocalDate(format = format, utcDiff = utcDiff)

def strDate(dt, format = None):
    #format = format if format else "%Y%m%d"
    return dt.strftime(format if format else "%Y%m%d")

def getDateFromTimestamp(tick):
    return datetime.fromtimestamp(tick / 1e3)

def localTime(dt = None, utcDiff = +8):
    """
    please update utcDiff by self
    """
    return ((dt if dt else datetime.utcnow()) + timedelta(hours = utcDiff))

def strLocalDate(dt = None, utcDiff = +8, format = None):
    return strDate(localTime(dt, utcDiff), format)

def addDays(days):
    return (datetime.now() + timedelta(days = days))


def guid():
    return str(uuid.uuid4())

# ini config file
#
# def getConfig(file = 'config.ini'):
#     config = ConfigParser()
#     config.read(file)
#     return config

# def getDbUri(file = 'config.ini'):
#     config = getConfig(file)
#     return config.get('DbSettings', 'DbUri')

def getConfig(file = 'config.json'):
    config = None
    try:
        content = open("config.json").read()
        config = json.loads(content)
    except Exception as e:
        raise e
    
    return config

def getDbUri(file = 'config.json'):
    config = getConfig(file)
    if config:
        return config["DbSettings"]["DbUri"]
    return None


if __name__ == "__main__":
    # print strDate(datetime.utcnow(), format = "%Y%m%d %H:%M:%S %f")
    # print strLocalDate(datetime.utcnow(), utcDiff = -4, format = "%Y%m%d %H:%M:%S %f")

    # print today(format = "%Y%m%d %H:%M:%S %f")

    dbUri = getDbUri()
    if dbUri:
        print dbUri
    else:
        print 'None'
