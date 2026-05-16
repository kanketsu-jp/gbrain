---
name: __BRAND_LOWER__-status
description: __BRAND_DISPLAY__ ルートと Kbrain の健康状態を確認する。「__BRAND_DISPLAY__ は元気？」「Kbrain の状態」「DBが動いてる？」と聞かれたら発火。`/__BRAND_LOWER__-status` でも呼べる。
---

# __BRAND_DISPLAY__ ステータス確認

## 手順

1. `kbrain --version` で CLI バージョン取得。
2. `kbrain doctor` を本ルートで実行し、Overseer モードの設定が正しいか確認。
3. Room 一覧（`__BRAND_PATH__/room/`）をカウントし、各Roomの `.kbrain/brain.pglite` の存在確認。
4. **Overseer 設定の読み込み**：`__BRAND_PATH__/.kbrain-overseer/config.json` が存在すれば Read ツールで読み、`mode` / `registered_rooms` / 主要設定値を表示する。存在しない場合は `Overseer: disabled` と表示。
5. 異常があれば修復方法を提示（`kbrain doctor --fix`、Roomの再初期化、`kbrain overseer init` など）。

## 出力形式

```
__BRAND_DISPLAY__ ステータス:
  kbrain CLI : <version>
  ルート     : __BRAND_PATH__
  Room 数    : N
  Overseer   : <enabled|disabled>  registered=N
  Issues     : <なし | 一覧>
```
