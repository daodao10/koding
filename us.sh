#!/usr/bin 
today=`date +%Y%m%d`

echo 'get data from gurufocus.com'
python gurufocus.py
echo 'done'

cd chart

echo 'get US ADV/DEC & NH-NL data'
node nhnl_us_etl.js $today

echo 'done'

cd ../learning/capture

if [ ! -d "$today" ]; then
    mkdir $today
fi

echo 'capture from finviz.com'
phantomjs finviz.js $today
