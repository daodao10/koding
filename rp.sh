#!/bin/bash
# get the last price of security from finance.yahoo.com

if [ "$#" -gt 0 ]; then
    symbol=$1
else
    read -p "pleas enter your symbol: " symbol
fi

curl -s "http://download.finance.yahoo.com/d/quotes.csv?s='$symbol'&f=l1"