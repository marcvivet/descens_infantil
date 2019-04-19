#!/bin/bash

sudo apt install -y mdbtools
mdb-tables -d ',' ../doc/Descens_LaMolina.accdb| xargs -L1 -d',' -I{} bash -c 'mdb-export ../doc/Descens_LaMolina.accdb "$1" >"$1".csv' -- {}
