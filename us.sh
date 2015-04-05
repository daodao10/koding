#!/usr/bin
# delay 15 hours based on UTC+8
today=`date -u -v-7H +%Y%m%d` # mac
# today=`date -u -d '-7 Hour' +%Y%m%d`
# today='20150402'

echo 'get data from gurufocus.com ...'
python gurufocus.py

echo 'check data ...'
python check_us.py

echo 'done'

cd chart

echo 'get US ADV/DEC & NH-NL data ...'
node nhnl_us_etl.js $today
echo 'summary NH-NL data'
node nhnl_us_sum_etl.js $today
echo 'done'

cd ../nd

echo 'get data from stockcharts ...'
node sc_etl.js

cd ../learning/capture

sh out.sh us
