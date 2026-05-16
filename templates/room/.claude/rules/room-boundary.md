---
name: room-boundary
description: このRoom外（親ディレクトリ含む）のファイルを編集してはならない
paths:
  - "**/*"
---

# Room 境界ルール

このディレクトリは Kbrain の **Room** です。`__ROOM_NAME__`。

## 基本方針：AutoMode 前提、ただし破壊コマンドはRoom内でも確認

このRoomは Claude Code の **AutoMode（許可ダイアログ最小化）** を前提に動く。許可プロンプトは可能な限り減らすが、破壊系コマンドは Kbrain 自身のファイル領域に限り **必ず実行前確認** する。

ルールの強制は `.claude/settings.json` の `permissions` でも宣言されている。本ファイルはその意図と運用ポリシーを明文化したもの。

## 必ず守る（Room外への書き込み禁止）

- **このRoomディレクトリより上 (`../**`) のファイル/ディレクトリは書き込まない・移動しない・削除しない**。
  これは `.claude/settings.json` の `deny` で強制されており、AutoMode でも自動で弾かれる。
- 親階層 (`../AGENTS.md`, `../CLAUDE.md`) の **読み取りのみ** 許可。書き換えはユーザーが KK2AIルート側のセッションで行う。
- ユーザーが「親階層も触ってよい」と明示した場合でも、書き込みは Room 内に閉じることを優先し、必要なら別セッションを案内する。

## 危険コマンドの扱い（`ask` で確認）

- 以下は **Room内であっても** 実行前にユーザーに意図を確認する（`.claude/settings.json` の `ask` 対象）：
  - `rm -rf ./**`（Room 全消去）
  - `rm -rf .kbrain/**`, `rm -rf .claude/**`, `rm -rf .kbrain-overseer/**`（Kbrain インフラ消去）
  - `rm AGENTS.md`, `rm CLAUDE.md`（テンプレ由来ファイルの削除）
  - `mv .kbrain/** *`, `mv .claude/** *` 等（Kbrain インフラの退避・改名）
  - `git reset --hard`, `git clean -fd`, `git checkout .`, `git restore .`（履歴・作業ツリー破壊）
- 上記以外のRoom内ファイル操作（`.temp/` の作業ファイル、ユーザー成果物、ノート類）は **AutoMode の自動許可で進めてよい**。

## 自動許可してよい範囲（allow）

- `Read` / `Glob` / `Grep` / Room 内 `Edit` / `Write`
- `ls`, `cat`, `head`, `tail`, `grep`, `rg`, `find .` などの非破壊コマンド
- `git status`, `git diff`, `git log`, `git show`, `git branch` などの参照系
- `kbrain` CLI 全般（破壊系サブコマンドを含むが、CLI 内部で確認する設計）

## 親階層の継承

- 親階層（KK2AIルート）の `AGENTS.md` / `CLAUDE.md` は **読み込み専用** で引き継ぐ。
- 引き継いだルールを書き換える必要が出たら、Room からは編集せず、ユーザーに KK2AIルート側で更新するよう伝える。
