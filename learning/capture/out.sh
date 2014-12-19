#!/bin/bash

today=`date +%Y%m%d`

if [ ! -d "$today" ]; then
    mkdir $today
fi

read -p "enter market(cn|us): " market
case $market in
us)
	echo 'capture from finviz.com'
	phantomjs finviz.js $today
	;;
cn)
	echo 'capture from eastmoney.com'
	for f in $(cat ./note.txt)
	do
	    phantomjs ct.js $f $today
	done
	;;
*)
	echo "don't support yet";;
esac
