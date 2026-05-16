---
name: root-directory
description: __BRAND_DISPLAY__ルートディレクトリの定義と呼称を固定する
paths:
  - "**/*"
---

# __BRAND_DISPLAY__ルートディレクトリ

- 絶対パス: `__BRAND_PATH__`
- 呼称: **「__BRAND_DISPLAY__ルートディレクトリ」**、略して **「__BRAND_DISPLAY__ルート」**
- このパスより下層を「__BRAND_DISPLAY__配下」「サブプロジェクト」と呼ぶ。
- ルートには以下が常駐する：
  - `AGENTS.md` — 全AI向けの最小インデックス
  - `CLAUDE.md` — `@AGENTS.md` のみを書き、AGENTS.md に委譲
  - `.claude/rules/` — 条件付きルール群
  - `.claude/agents/` — __BRAND_DISPLAY__横断のエージェント定義
  - `.claude/skills/` — __BRAND_DISPLAY__ 操作 Skills
  - `room/` — 各 Room（独立した Kbrain 環境）
  - `.kbrain-overseer/` — 横断モードのレジストリ（任意）

## 適用

- 「ルート」「プロジェクトルート」と書かれたら、文脈で明示されない限り **__BRAND_DISPLAY__ルート** を指す。
- パスを記述する際は __BRAND_DISPLAY__ルート起点の相対パスか絶対パスを使い、曖昧な `./` は避ける。
