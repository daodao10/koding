#!/usr/bin 

echo 'get data from 163.com ...'
python asia.py cn


cd ./learning/capture
sh out.sh cn


cd ../../nd
sh em_etl.sh
