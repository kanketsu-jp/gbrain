---
name: __BRAND_LOWER__-init
description: __BRAND_DISPLAY__ の新しい Room を作成する。ユーザーが「Roomを作りたい」「新しい作業環境がほしい」「__BRAND_DISPLAY__ で初期化」と言ったときや、`/__BRAND_LOWER__-init` と打ったときに発火。
---

# __BRAND_DISPLAY__ Room の作成

このスキルは __BRAND_DISPLAY__ ルート (`__BRAND_PATH__`) で実行する。**他の場所では実行しない**。

## 手順

1. **作業ディレクトリ確認**：現在のCWDが `__BRAND_PATH__` または `__BRAND_PATH__/room` であることを確認。違う場合はユーザーに確認してから移動。
2. **AskUserQuestion で必要情報を取得**：
   - Q1: Room 名（ディレクトリ名にも使う / kebab-case 推奨）
   - Q2: Room の用途（短い説明、AGENTS.md に書く）
   - Q3: 初期スキル（任意。後から追加可能なのでスキップしてもよい）
3. **既存チェック**：`__BRAND_PATH__/room/<name>/` が既にあれば中止。別名を提案。
4. **Kbrain CLI 呼び出し**：
   ```bash
   KBRAIN_LANG=ja kbrain init-room \
     --path __BRAND_PATH__/room/<name> \
     --name <name> \
     --parent-brand __BRAND_DISPLAY__ \
     --non-interactive
   ```
5. **Room AGENTS.md に用途を追記**：Q2 の回答を Room 内 `AGENTS.md` の冒頭セクションに追記。
6. **完了報告**：Room パスと、次のセッション開始方法（`cd __BRAND_PATH__/room/<name>` で入って Claude Code / Codex を起動）を伝える。

## 注意

- 既存 Room を上書きしない。
- Room 作成後、現在のセッションはそのままで、ユーザーは別途新しい場所でセッションを開始する想定。本セッションで自動的に `cd` しない。
