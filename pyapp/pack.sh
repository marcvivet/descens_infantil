#!/bin/bash

QTWEBENGINEPROCESS_PATH=/Users/mvivet/local/src/other/descens_infantil/.venv/lib/python3.7/site-packages/PyQt5/Qt/lib/QtWebEngineCore.framework/Helpers/QtWebEngineProcess.app/Contents/MacOS/QtWebEngineProcess

rm -rvf pyappdist
# pyinstaller --onefile --distpath pyappdist server.spec
pyinstaller --clean --distpath pyappdist server.spec