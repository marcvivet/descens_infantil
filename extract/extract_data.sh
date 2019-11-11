#!/bin/bash

#sudo apt install -y mdbtools
#ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)" < /dev/null 2> /dev/null
#brew install mdbtools

tables=(`mdb-tables -d ' ' ../doc/Descens_LaMolina.accdb`)
for table in "${tables[@]}"
do
	echo $table
    mdb-export ../doc/Descens_LaMolina.accdb "$table" >"$table.csv"
done