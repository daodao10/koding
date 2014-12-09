#!/bin/bash

today=`date +%Y%m%d`

if [ ! -d "$today" ]; then
    mkdir $today
fi

echo 'capture from eastmoney.com'
for f in $(cat ./note.txt)
do
    phantomjs ct.js $f $today
done

echo 'capture from finviz.com'
phantomjs finviz.js $f $today