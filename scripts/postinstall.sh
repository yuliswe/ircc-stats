#!/bin/sh

git config core.hooksPath scripts/git-hooks

# dotenv-linter is a local developer convenience installed via Homebrew, which
# only exists on developer macOS machines. CI runners (Linux) have no brew, so
# skip the install there rather than failing `npm ci` with a 127 exit code.
if command -v brew >/dev/null 2>&1; then
  brew install dotenv-linter
fi
