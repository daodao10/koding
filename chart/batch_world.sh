# generate download shell script of world
node opt_pre_etl.js s/indices.txt 1 > dl_world.sh
node opt_pre_etl.js s/future.txt 1 >> dl_world.sh
node opt_pre_etl.js s/stooq.txt 1 >> dl_world.sh
# download
sh dl_world.sh
#python google_etl.py s/google_d.txt

# etl opt
node opt_etl.js s/indices.txt
node opt_etl.js s/future.txt
node opt_etl.js s/stooq.txt
<<<<<<< HEAD
node opt_etl.js s/google_d.txt
node opt_etl.js s/yahoo_d.txt
=======
#node opt_etl.js s/google_d.txt
# # node opt_etl.js s/yahoo_d.txt
>>>>>>> 032674e... update file property

cd ../nd
# BDI etl
node any-db.js
# MSCI etl
node msci_etl.js
# CNYX & CNYR
node cnindex_etl.js
