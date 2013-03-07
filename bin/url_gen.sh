#!/bin/bash

DOMAIN=YOUR.DOMAIN.HERE
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
