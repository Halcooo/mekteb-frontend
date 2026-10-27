#!/bin/bash
set -eu
test -f dist/index.html
test -f dist/sw.js
test -f dist/manifest.webmanifest
stage_root="$HOME/mekteb-staging/frontend"
mkdir -p "$stage_root"
/usr/bin/rsync -a dist/ "$stage_root/"
printf '%s\n' 'Frontend candidate staged. Activate with the matching verified backend release.'
