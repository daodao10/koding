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
  NotFound = '<title>Error 404 \(Not Found\)!!1</title>'

  def __init__(self,symbol,start_date,end_date=datetime.date.today().isoformat()):
    super(GoogleQuote,self).__init__()
    self.symbol = symbol.upper()
    start = datetime.date(int(start_date[0:4]),int(start_date[5:7]),int(start_date[8:10]))
    end = datetime.date(int(end_date[0:4]),int(end_date[5:7]),int(end_date[8:10]))
    url_string = "https://www.google.com/finance/historical?q={0}&startdate={1}&enddate={2}".format(
      self.symbol,start.strftime('%b %d, %Y'),end.strftime('%b %d, %Y'))

    csv = urllib.urlopen(url_string + "&output=csv").readlines()
    m = re.search(self.NotFound, csv[0])
    if m:
      print 'try again - get page by page'
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
