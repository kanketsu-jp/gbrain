# Room: __ROOM_NAME__

> このディレクトリは Kbrain の **Room**。独立した脳（`.kbrain/`）を持ち、親階層（KK2AIルート相当）の `AGENTS.md` / `CLAUDE.md` を継承する。

## 起動方法

このRoom内で Claude Code / Codex / OpenCode などを起動すると、自動的に `.kbrain/` が Kbrain の DB として使われる（環境変数 `GBRAIN_HOME` で解決）。

シェルから直接 Kbrain を叩く場合：

```bash
cd __ROOM_PATH__
GBRAIN_HOME=$(pwd)/.kbrain kbrain <command>
```

## このRoomで守ること

- **Room外のファイルを編集しない**。詳細は `.claude/rules/room-boundary.md`。
- 一時ファイルは `.temp/` に置く（親ルールを継承）。
- このRoom配下に置いた知識（markdown）は、`.kbrain/pages/` 配下に整理することで Kbrain の検索対象になる。

## メタ情報

- Room名: `__ROOM_NAME__`
- 作成: `__CREATED_AT__`
- 親: `__PARENT_BRAND__`（KK2AIルート）
