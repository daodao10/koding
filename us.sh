#!/usr/bin
# delay 15 hours based on UTC+8
today=`date -u -v-7H +%Y%m%d` # mac
# today=`date -u -d '-7 Hour' +%Y%m%d`

echo 'get data from gurufocus.com ...'
python gurufocus.py

echo 'check data ...'
python check_us.py

echo 'done'

cd chart

echo 'get US ADV/DEC & NH-NL data ...'
node nhnl_us_etl.js $today
echo 'done'


cd ../learning/capture

sh out.sh us
