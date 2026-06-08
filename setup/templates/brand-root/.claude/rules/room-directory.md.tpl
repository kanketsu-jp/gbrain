---
name: room-directory
description: room/ 配下は各 Room 独立した Kbrain 環境。Room境界を越えない
paths:
  - "room/**"
  - "**/room/**"
---

# Room ディレクトリ規約

## Room とは

- `__BRAND_PATH__/room/<name>/` を **Room** と呼ぶ。
- 各Roomは **独立した Kbrain DB / 設定 / カスタムスキル** を `.kbrain/` 配下に持つ。
- Roomディレクトリ内でセッション（Claude Code / Codex / OpenCode）を開始すると、自動的にそのRoomの脳が使われる（`GBRAIN_HOME=$(pwd)/.kbrain` 相当）。

## 作成

- Skill `__BRAND_LOWER__-init` から作成する。自然言語でも `/`__BRAND_LOWER__-init` でも呼べる。
- 内部で `kbrain init-room --path <abs> --name <room-name>` を呼ぶ。

## 境界

- Room内のセッションから **Room外（親階層・他のRoom）を編集してはならない**。
- 境界違反は Room内 `.claude/settings.json` の deny で機械的に弾かれる。
- ユーザーが明示許可した範囲のみ、当該会話で一時的に外して作業可能。

## __BRAND_DISPLAY__ルートからの横串

- __BRAND_DISPLAY__ルートで起動したセッションは、`.kbrain-overseer/` のレジストリ経由で全Roomを **read-only で横断検索** できる。
- 横断検索は `kbrain overseer search <query>` または Skill `__BRAND_LOWER__-status` 経由。Write は不可。
