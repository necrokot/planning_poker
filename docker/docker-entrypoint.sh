#!/bin/sh
set -e

echo "$BASIC_AUTH_USER:$(openssl passwd -apr1 "$BASIC_AUTH_PASS")" > /etc/nginx/.htpasswd
chmod 600 /etc/nginx/.htpasswd

exec nginx -g "daemon off;"
