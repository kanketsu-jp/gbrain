#!/usr/bin/env bash
# Kbrain ブランドルート セットアップスクリプト
#
# 配布物（zip / クローン）の中で叩くと、対話なしでブランドルートを作る。
# 例:
#   ./setup/install.sh --brand KK2AI --path ~/Develop/Projects/KK2AI
#   ./setup/install.sh --brand TANAKA-AI --path ~/Develop/Projects/TANAKA-AI
#
# 前提: kbrain CLI が PATH にあること（`bun install && bun link`、または `bun install -g`）。
# kbrain が無ければ、本スクリプト先頭で bun link を試みる。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KBRAIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

usage() {
  cat <<EOF
Usage: $0 --brand <UPPER> --path <abs-path> [--lower <lower>] [--display <display>] [--force]

必須:
  --brand    ブランド名（大文字スネーク推奨。例: KK2AI / TANAKA-AI）
  --path     セットアップ先の絶対パス（例: ~/Develop/Projects/KK2AI）

任意:
  --lower    ブランド小文字（デフォルト: --brand の小文字化）
  --display  表示名（デフォルト: --brand と同じ）
  --force    既存ファイルを上書き
EOF
}

if [[ $# -eq 0 ]]; then
  usage
  exit 1
fi

# kbrain が無ければ、リポジトリ内で bun link を試行。
if ! command -v kbrain >/dev/null 2>&1; then
  echo "[install] kbrain CLI が見つかりません。bun link を試みます ..."
  if ! command -v bun >/dev/null 2>&1; then
    echo "[install] bun が必要です。https://bun.com からインストールしてください。"
    exit 1
  fi
  (cd "${KBRAIN_ROOT}" && bun install && bun link)
fi

# kbrain setup に引数をそのまま流す。
KBRAIN_LANG="${KBRAIN_LANG:-ja}" kbrain setup "$@"
