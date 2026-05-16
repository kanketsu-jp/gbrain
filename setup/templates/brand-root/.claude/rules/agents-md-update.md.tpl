---
name: agents-md-update
description: AGENTS.md/CLAUDE.md に直接追記せず context-router で配置先を判定する
paths:
  - "**/AGENTS.md"
  - "**/CLAUDE.md"
  - ".claude/rules/**"
  - ".claude/agents/**"
  - ".claude/skills/**"
---

# 指示・ルールを追加するときの手順

## 禁止事項

- `AGENTS.md` / `CLAUDE.md` に**直接追記しない**。これらは「最小インデックス」であり、内容を増やすほどシグナル/ノイズ比が落ちる（80% 圧縮しても通る、というベンチマーク結果に基づく方針）。

## 正しい手順

ユーザーから新しい指示・ルール・ナレッジを渡されたら、次の流れで処理する：

1. **`context-router` エージェントを呼ぶ**（`.claude/agents/context-router.md`）。
2. ルーターの判断に従ってファイルを作成・更新する。
3. **インデックス（`AGENTS.md` の「ルール参照インデックス」表）に1行だけ追記** する。本文はインデックス先のファイルに書く。

## 判定の目安

- 常時・全タスクで必要 → `AGENTS.md` のインデックスから参照する `.claude/rules/` ファイル
- 特定ファイル種・特定操作のみ必要 → `.claude/rules/` に frontmatter `paths:` 付きで作る
- 手順・ワークフロー（オンデマンドで呼ぶ） → Skills (`.claude/skills/<name>/SKILL.md`)
- 役割を持って自走させたい判断ロジック → サブエージェント (`.claude/agents/`)
- ユーザー個人・1リポジトリを超える全体ルール → `~/.claude/CLAUDE.md`（グローバル）
