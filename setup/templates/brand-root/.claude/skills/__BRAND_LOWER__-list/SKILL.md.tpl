---
name: __BRAND_LOWER__-list
description: __BRAND_DISPLAY__ の Room を一覧表示する。「Roomを一覧」「どんなRoomがある」「__BRAND_DISPLAY__ の状況」と聞かれたとき、または `/__BRAND_LOWER__-list` で発火。
---

# __BRAND_DISPLAY__ Room 一覧

## 手順

1. `__BRAND_PATH__/room/` 配下のディレクトリを列挙する（`.kbrain/` を持つものだけが正規 Room）。
2. 各 Room について以下を表示：
   - Room 名（ディレクトリ名）
   - 作成日（`.kbrain/config.json` の `created_at`）
   - AGENTS.md 冒頭の用途行
   - 直近の最終更新（`.kbrain/brain.pglite` のmtime）
3. Room が存在しない場合は、`__BRAND_LOWER__-init` Skill で作成するよう案内。

## 出力形式

```
__BRAND_DISPLAY__ Room 一覧 (N 件):
  - <room-name>  ／ 用途: <description>
    作成 <YYYY-MM-DD>  最終更新 <YYYY-MM-DD HH:MM>
    パス: __BRAND_PATH__/room/<room-name>
```
