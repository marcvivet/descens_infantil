#!/bin/bash

rm -rvf pyappdist
# pyinstaller --onefile --distpath pyappdist server.spec
pyinstaller --distpath pyappdist server.spec