#!/bin/bash

# delay 12 hours based on UTC+8
today=`date -u -v-4H +%Y%m%d` # mac
# today=`date -u -d "-4 hour" +%Y%m%d`
# today='20150129'

if [ ! -d "$today" ]; then
    mkdir $today
fi

if [ "$#" -gt 0 ]
then
    market=$1
else
    read -p "enter market(cn|us): " market
fi

case $market in
us)
    echo 'capture from finviz.com ...'
    phantomjs finviz.js $today
    ;;
cn)
    echo 'capture from eastmoney.com ...'
    for f in $(cat ./note.txt)
    do
        phantomjs ct.js $f $today
    done
    ;;
*)
    echo "don't support yet";;
esac
