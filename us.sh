#!/usr/bin

today=`date -d '-13 hour' +%Y%m%d`

echo 'get data from gurufocus.com ...'
python gurufocus.py
echo 'done'


cd chart

echo 'get US ADV/DEC & NH-NL data ...'
node nhnl_us_etl.js $today
echo 'done'


cd ../learning/capture

sh out.sh us
