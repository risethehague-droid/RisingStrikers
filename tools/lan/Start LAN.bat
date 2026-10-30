@echo off
rem HC2 Football - start a LAN match server on this PC (t-044). Double-click it.
rem The game opens in your browser and this window shows the address for the other PC.
rem When Windows Security asks about Python: tick Private networks, then Allow access.
cd /d "%~dp0"
where py >nul 2>nul && (py -3 serve.py %* & goto done)
where python >nul 2>nul && (python serve.py %* & goto done)
echo Python 3 is needed: get it from https://www.python.org/downloads/ (tick "Add python.exe to PATH"), then double-click this again.
:done
pause
