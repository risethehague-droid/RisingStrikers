#!/usr/bin/env bash
# Build game/labtest.html: the Test Lab as a normal page for the headless tests (tools/grp.js, gk091.js, chipgif.js).
# lab.html is written for claude.ai (no <head>, Phaser from the CDN); this wraps it and points it at the local phaser.min.js.
# Rerun after any change to lab.html. labtest.html is not committed (.gitignore).
cd "$(dirname "$0")/../game" || exit 1
{ echo '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'
  sed 's#https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js#phaser.min.js#' lab.html
  echo '</body></html>'; } > labtest.html
echo "built game/labtest.html"
