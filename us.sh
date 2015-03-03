#!/usr/bin
# delay 12 hours based on UTC-5
# today=`date -u -v-17H +%Y%m%d` # mac
today=`date -u -d '-17 Hour' +%Y%m%d`

echo 'get data from gurufocus.com ...'
python gurufocus.py
echo 'done'


cd chart

echo 'get US ADV/DEC & NH-NL data ...'
node nhnl_us_etl.js $today
echo 'done'


cd ../learning/capture

sh out.sh us
