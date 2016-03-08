#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys,re
from quotes import Quote, GoogleQuote

# import package
# package.append_dir('../..')
# from koding import debug

def smoke_test():
  q = GoogleQuote('aapl','2015-01-01')              # download year to date Apple data
  print q                                           # print it out
  print '-------------------- get pass --------------------'
  
  q = GoogleQuote('orcl','2011-11-01','2011-11-30') # download Oracle data for February 2011
  q.write_csv('orcl.csv')                           # save it to disk
  print '-------------------- write_csv pass --------------------'
  
  q = Quote()                                       # create a generic quote object
  q.read_csv('orcl.csv')                            # populate it with our previously saved data
  print q                                           # print it out
  print '-------------------- read_csv pass --------------------'

def help():
  print 'USAGE: python google_etl.py <filename>'

def parse_setting(str):
  RegSetting = re.compile(r'\[(\w+)\s*:\s*(\w+)\s*:\s*(\w+)(,\s*(\w+))*\]')
  m = RegSetting.search(str)
  if m:
    # print m.groups()
    setting = {"source":m.group(1), "market":m.group(2)}
    setting["period"] = [m.group(3)]

    if m.group(4):
      setting["period"].append(m.group(5))

    return setting

  return None

def encode_period(period):
  if period == "monthly":
    return "m"
  elif period == "weekly":
    return "w"
  else:
    return "d"

def get_output(settings, code):
  return "%s_%s_%s.csv" % (settings["market"], code, encode_period(settings["period"][0]))

def main():
  '''
  currently support market: world, us, hk, cn, sg
  '''

  filename = None
  args = sys.argv
  if len(args) == 2:
      filename = args[1]
  else:
      help()
      return

  i = 0
  settings = None
  for line in open(filename,'r'):
    i += 1
    if i == 1:
      settings = parse_setting(line)
      print settings
      continue

    symbol,code = (lambda x: x.rstrip().split(',')[0:2])(line)
    if not settings:
      break

    if settings["market"] == "cn":
      if symbol.startswith("6"):
        symbol = "SHA:" + symbol
      elif symbol.startswith("0") or symbol.startswith("3"):
        symbol = "SHE:" + symbol
    elif settings["market"] == "hk":
      symbol = "HKG:" + symbol
    elif settings["market"] == "sg":
      symbol = "SGX:" + symbol

    q = GoogleQuote(symbol,'1985-01-01', '2016-12-31')
    q.write_csv(get_output(settings, code))

    print '-------------------- done %s --------------------' % symbol


if __name__ == '__main__':
  forTest = False
  if forTest:
    smoke_test()
  else:
    main()
