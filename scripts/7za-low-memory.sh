#!/usr/bin/env sh

# Electron Builder invokes 7-Zip with its default thread count. Restricting
# this sandbox-only wrapper to one worker avoids an out-of-memory kill while
# producing the same portable Windows artifact.
set -eu

archive_tool="$(dirname "$0")/7za-real"
command="$1"
shift

# Put the overrides last so they take precedence over Electron Builder's
# default `-mx=9` choice. A small dictionary avoids the large LZMA allocation
# that previously caused the sandbox process to be interrupted.
exec "$archive_tool" "$command" "$@" -mx=1 -mmt=1 -md=8m
