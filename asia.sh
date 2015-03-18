#!/usr/bin 

echo '--------------------------------------------'
echo '***** get data from sgx ... *****'
python asia.py sg

echo '***** get data from 163.com ... *****'
python asia.py cn

echo '*****'
cd ./learning/capture
sh out.sh cn

echo '*****'
cd ../../nd
sh em_etl.sh

echo '***** check data *****'
cd ..
python check_asia.py
echo '--------------------------------------------'
