---
name: inheritance
description: 下層ディレクトリは__BRAND_DISPLAY__ルートのAGENTS.md/CLAUDE.mdを引き継ぐ
paths:
  - "**/AGENTS.md"
  - "**/CLAUDE.md"
  - "**/*"
---

# 継承ルール（AGENTS.md / CLAUDE.md）

## 原則

- __BRAND_DISPLAY__ルート配下のすべてのサブディレクトリは、__BRAND_DISPLAY__ルートの `AGENTS.md` と `CLAUDE.md` を **暗黙的に引き継ぐ**。
- Claude Code は親階層の `CLAUDE.md` を自動的に辿るが、**他AI（Codex / Cursor / OpenCode / 任意の AGENTS.md 対応エージェント）でも同等に効くよう、ルールはなるべく `AGENTS.md` 側に集約**する。
- `CLAUDE.md` は原則 `@AGENTS.md` の1行参照に留め、AGENTS.md に委譲する。

## 階層ごとの拡張

- 各サブディレクトリは独自の `AGENTS.md` / `CLAUDE.md` を置いてよい。
- 子の指示はルートの指示を **上書きではなく追加** する形が原則。ルートと矛盾する場合は、子ファイル冒頭に「ルートの〇〇を本ディレクトリでは△△に置き換える」と明示。

## Room の場合

- `room/<name>/` 配下では、ルートのルールを継承しつつ、Room独自の境界ルール（`.claude/rules/room-boundary.md`）が**上書きで**効く。
- Room からRoom外（親ディレクトリ）を編集してはならない。詳細は Room内の `room-boundary.md` 参照。
