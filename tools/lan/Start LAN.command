#!/bin/bash
# HC2 Football - start a LAN match server on this Mac (t-044). Double-click it in Finder.
# The first time, macOS may say it's from an unidentified developer: right-click it > Open > Open.
# Then the game opens in your browser and this window shows the address for the other PC.
cd "$(dirname "$0")" || exit 1
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is needed. macOS will offer to install it (the Command Line Tools) - say Install, then double-click this again."
  python3 --version
  read -r -p "Press Enter to close." _
  exit 1
fi
python3 serve.py "$@"
read -r -p "The LAN server stopped. Press Enter to close." _
