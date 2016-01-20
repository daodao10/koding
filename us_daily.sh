#!bin/bash
#pwd

if [ "$#" -gt 0 ]
then
    today=$1
else
    read -p "what date is today: " today
fi

python gurufocus.py $today

cd nd
node sc_etl.js $today

cd ../chart
node nhnl_us_etl.js $today
node nhnl_us_sum_etl.js $today

cd ../learning/capture
echo 'capture from finviz.com ...'
phantomjs finviz.js $today

cd ../../

echo 'check data ...'
python check_us.py

read -rsp $'Press any key to exit...\n' -n 1 key