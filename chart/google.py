# Copyright (c) 2011, Mark Chenoweth
# All rights reserved.
# http://trading.cheno.net/downloading-google-finance-historical-data-with-python/
# Redistribution and use in source and binary forms, with or without modification, are permitted 
# provided that the following conditions are met:
#
# - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
#
# - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following 
#   disclaimer in the documentation and/or other materials provided with the distribution.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, 
# INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
# EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS 
# OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
# STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF 
# ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


# ******************************************
# 
# NEW PATCH (by dao)
# to handle more symbol which do not provide download's link
# 
# ******************************


import urllib,time,datetime,re

class Quote(object):
  
  DATE_FMT = '%Y-%m-%d'
  TIME_FMT = '%H:%M:%S'
  
  def __init__(self):
    self.symbol = ''
    self.date,self.time,self.open_,self.high,self.low,self.close,self.volume = ([] for _ in range(7))

  def append(self,dt,open_,high,low,close,volume):
    self.date.append(dt.date())
    self.time.append(dt.time())
    self.open_.append(self.convert_2_float(open_))
    self.high.append(self.convert_2_float(high))
    self.low.append(self.convert_2_float(low))
    self.close.append(self.convert_2_float(close))
    self.volume.append(self.convert_2_int(volume))
      
  def to_csv(self):
    return 'Symbol,Date,Time,Open,High,Low,Close,Volume\n' + ''.join(["{0},{1},{2},{3:.2f},{4:.2f},{5:.2f},{6:.2f},{7}\n".format(self.symbol,
              self.date[bar].strftime(self.DATE_FMT),self.time[bar].strftime(self.TIME_FMT),
              self.open_[bar],self.high[bar],self.low[bar],self.close[bar],self.volume[bar]) 
              for bar in xrange(len(self.close))])
    
  def write_csv(self,filename):
    with open(filename,'w') as f:
      f.write(self.to_csv())
        
  def read_csv(self,filename):
    self.symbol = ''
    self.date,self.time,self.open_,self.high,self.low,self.close,self.volume = ([] for _ in range(7))
    i = 0
    for line in open(filename,'r'):
      i += 1
      if i == 1:
        continue
      symbol,ds,ts,open_,high,low,close,volume = line.rstrip().split(',')
      self.symbol = symbol
      self.append(datetime.datetime.strptime(ds+' '+ts, self.DATE_FMT+' '+self.TIME_FMT),open_,high,low,close,volume)
    return True

  def patch(self, url, start, total):
    pass

  def convert_2_float(self, str):
    return 0 if str == "-" else float(str.replace(',', ''))
    # float(str.replace(',', ''))

  def convert_2_int(self, str):
    return 0 if str == "-" else int(str.replace(',', ''))
    # int(str.replace(',', ''))

  def __repr__(self):
    return self.to_csv()


class GoogleQuote(Quote):
  ''' Daily quotes from Google. Date format='yyyy-mm-dd' '''

  RegRow = re.compile(r'<td\s+class="lm">([a-zA-Z0-9-\s,]*)\n<td\s+class="rgt">([0-9-,.]+)\n<td\s+class="rgt">([0-9-,.]+)\n<td\s+class="rgt">([0-9-,.]+)\n<td\s+class="rgt">([0-9-,.]+)\n<td\s+class="rgt rm">([0-9-,.]+)', re.MULTILINE)
  RegPagination = re.compile('google.finance.applyPagination\(\n[0-9]*,\n[0-9]*,\n([0-9]*),', re.MULTILINE)
  NotFound = '<title>Not Found</title>'

  def __init__(self,symbol,start_date,end_date=datetime.date.today().isoformat()):
    super(GoogleQuote,self).__init__()
    self.symbol = symbol.upper()
    start = datetime.date(int(start_date[0:4]),int(start_date[5:7]),int(start_date[8:10]))
    end = datetime.date(int(end_date[0:4]),int(end_date[5:7]),int(end_date[8:10]))
    url_string = "http://www.google.com/finance/historical?q={0}&startdate={1}&enddate={2}".format(
      self.symbol,start.strftime('%b %d, %Y'),end.strftime('%b %d, %Y'))

    csv = urllib.urlopen(url_string + "&output=csv").readlines()
    m = re.search(self.NotFound, csv[0])
    if m:
      # print 'not found'
      self.patch(url_string, 0, 0)
    else:
      #csv.reverse()
      for bar in xrange(1,len(csv)-1):
        ds,open_,high,low,close,volume = csv[bar].rstrip().split(',')
        self.append(datetime.datetime.strptime(ds,'%d-%b-%y'),open_,high,low,close,volume)
    
  def patch(self, url, start, total):
    PageSize = 200
    newUrl = (url + "&start={0}&num={1}").format(start, PageSize)
    content = urllib.urlopen(newUrl).read()

    # debug.save('data.txt', content)
    list = re.findall(self.RegRow, content)
    # group: date, o, h, l, c, volume
    for group in list:
      # decide non-trading day by close price
      # if group[4] == '-':
      if group[1] == '-':
        print 'non-trading day: %s' % str(group)
        continue
      self.append(datetime.datetime.strptime(group[0],'%b %d, %Y'),
        group[1],
        group[2],
        group[3],
        group[4],
        group[5])

    if start == 0:
      for m in self.RegPagination.finditer(content):
        total = int(m.group(1))

    if total > start + PageSize:
      # print(start + PageSize)
      self.patch(url, start + PageSize, total)


import sys
import package
package.append_dir('../..')

from koding import debug

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
  print 'USAGE: python google.py <filename>'

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

  i = 0
  settings = None
  for line in open(filename,'r'):
    i += 1
    if i == 1:
      settings = parse_setting(line)
      print settings
      continue

    symbol,code = line.rstrip().split(',')
    if not settings:
      break

    if settings["market"] == "cn":
      if symbol.startswith("6"):
        symbol = "SHA:" + symbol
      else:
        symbol = "SHE:" + symbol
    elif settings["market"] == "hk":
      symbol = "HKG:" + symbol
    elif settings["market"] == "sg":
      symbol = "SGX:" + symbol

    q = GoogleQuote(symbol,'1985-01-01', '2015-12-31')
    q.write_csv(get_output(settings, code))

    print '-------------------- done %s --------------------' % symbol


if __name__ == '__main__':
  forTest = True
  if forTest:
    smoke_test()
  else:
    main()
