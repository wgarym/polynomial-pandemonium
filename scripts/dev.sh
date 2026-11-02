#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if command -v node >/dev/null 2>&1 && command -v pnpm >/dev/null 2>&1; then
  exec pnpm dev
fi
runtime="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies"
if [ -x "$runtime/node/bin/node" ]; then
  export PATH="$runtime/node/bin:$PATH"
  exec "$runtime/node/bin/node" node_modules/vite/bin/vite.js --host 127.0.0.1
fi
printf '%s\n' 'Install Node 22.12+ and pnpm, then run pnpm install and pnpm dev.' >&2
exit 1
