#!/bin/zsh
set -e

PROJECT_DIR=${0:A:h}
cd "$PROJECT_DIR"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  source "$NVM_DIR/nvm.sh"
fi

nvm use
if [[ ! -d node_modules ]]; then
  npm install
fi
npm run dev
