#!/bin/bash

rm -rvf pyappdist
pyinstaller pyapp/server.py --onefile --distpath pyappdist