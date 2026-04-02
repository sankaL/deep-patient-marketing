#!/bin/sh
set -eu

: "${BACKEND_UPSTREAM_URL:?BACKEND_UPSTREAM_URL must be set}"

if [ -z "${NGINX_LOCAL_RESOLVERS:-}" ]; then
  NGINX_LOCAL_RESOLVERS="$(awk '/^nameserver/ {print $2}' /etc/resolv.conf | paste -sd ' ' -)"
fi

: "${NGINX_LOCAL_RESOLVERS:=127.0.0.11}"

NORMALIZED_RESOLVERS=""
for resolver in $NGINX_LOCAL_RESOLVERS; do
  case "$resolver" in
    *:*)
      resolver="[$resolver]"
      ;;
  esac
  NORMALIZED_RESOLVERS="${NORMALIZED_RESOLVERS}${NORMALIZED_RESOLVERS:+ }${resolver}"
done

NGINX_LOCAL_RESOLVERS="$NORMALIZED_RESOLVERS"

export BACKEND_UPSTREAM_URL
export NGINX_LOCAL_RESOLVERS

envsubst '${BACKEND_UPSTREAM_URL} ${NGINX_LOCAL_RESOLVERS}' \
  < /opt/nginx/default.conf.template \
  > /etc/nginx/conf.d/default.conf
