# generate download shell script of world
node opt_pre_etl.js s/indices.txt 1 > dl_world.sh
node opt_pre_etl.js s/future.txt 1 >> dl_world.sh
node opt_pre_etl.js s/stooq.txt 1 >> dl_world.sh
# download
sh dl_world.sh
python google_etl.py s/google.txt
# etl opt
node opt_etl.js s/indices.txt
node opt_etl.js s/future.txt
node opt_etl.js s/stooq.txt
node opt_etl.js s/google.txt
node opt_etl.js s/dao_d.txt

cd ../nd
# BDI etl
node any-db.js
# MSCI etl
node msci_etl.js
