#!/bin/bash
#
# Usage:
# $ DOMAIN=example.com ./url_gen.sh URI:DIR2-RO:gdfys4rrb421cqprha46tu3edm:wwyfx52w7fre7ujbczcny6dy374ozihwarwjwkgpy77ymxcwkita
# https://example.com/d/ro/wwyfx52w7fre7ujbczcny6dy374ozihwarwjwkgpy77ymxcwkita/gdfys4rrb421cqprha46tu3edm/ (REVERSE=true)
# https://example.com/d/ro/gdfys4rrb421cqprha46tu3edm/wwyfx52w7fre7ujbczcny6dy374ozihwarwjwkgpy77ymxcwkita/ (REVERSE=false)
#
# Make sure to change REVERSE to the appropriate value if you want URI's reversed or not

REVERSE=true

URL="https://${DOMAIN}/d"

IFS=':' read -ra ADDR <<< "$1"

if [ "${ADDR[1]}" == "DIR2-RO" ]; then
  URL="${URL}/ro"
fi

if $REVERSE ; then
  URL="${URL}/${ADDR[${#ADDR[@]}-1]}/${ADDR[${#ADDR[@]}-2]}/"
else
  URL="${URL}/${ADDR[${#ADDR[@]}-2]}/${ADDR[${#ADDR[@]}-1]}/"
fi

echo "$URL"
