# __BRAND_DISPLAY__ — AGENTS.md

> このファイルは __BRAND_DISPLAY__ ルート（`__BRAND_PATH__`）の全エージェント共通の起点。**詳細ルールは `.claude/rules/` を参照**する（学習データより参照型推論を優先）。

## 0. 大前提

- 本リポジトリのルート `__BRAND_PATH__` を **「__BRAND_DISPLAY__ルートディレクトリ」（略: __BRAND_DISPLAY__ルート）** と呼ぶ。
- **下層ディレクトリは __BRAND_DISPLAY__ルートの `CLAUDE.md` と `AGENTS.md` を引き継ぐ。** 各階層に独自の `AGENTS.md` / `CLAUDE.md` を置いてもよいが、ルートのルールは常に有効。
  - Claude Code は自動的に親階層の CLAUDE.md を読み込むが、他AI（Codex / OpenCode 等）でも同等になるようルート方針を `AGENTS.md` に集約する。
- `CLAUDE.md` には `@AGENTS.md` と書いて `AGENTS.md` を参照させる方式を採る。

## 1. 作業手順（順序が重要）

1. **まず本ファイルと `.claude/rules/` を確認**してからツール／スキルを呼ぶ。
2. ルール本体を読むタイミングは「該当パスに触れる直前」でよい（条件付き注入）。
3. `AGENTS.md` への直接追記は禁止。追記したい内容があれば **`context-router` エージェント（`.claude/agents/context-router.md`）に判定させる**。Skills / Rules / AGENTS.md / CLAUDE.md のどこに置くべきかを返す。

## 2. ルール参照インデックス（`.claude/rules/`）

| ファイル | 適用範囲 | 要点 |
| --- | --- | --- |
| `root-directory.md` | 全体 | __BRAND_DISPLAY__ルートの定義と呼称 |
| `inheritance.md` | 全階層 | 下層は親の AGENTS.md / CLAUDE.md を引き継ぐ |
| `temp-dir.md` | 全階層 | 一時データは `.temp/` のみ。各セッション開始位置に作成 |
| `agents-md-update.md` | `AGENTS.md` / `CLAUDE.md` 編集時 | 直接書かず `context-router` で配置先判定 |
| `room-directory.md` | `room/` 配下 | 各 Room は独立した Kbrain を持つ。Room境界を越えない |

## 3. Kbrain との関係

- 本ルートには Kbrain CLI（`kbrain`）がセットアップ済み。
- **Room モード**：`room/<name>/` で各セッションを起動すると、その Room の `.kbrain/` が独立DBとして使われる。
- **Overseer モード**：本ルートで起動したセッションは、`.kbrain-overseer/` のレジストリ経由で全Roomを横断read-only検索できる。
- 新規Roomは Skill `__BRAND_LOWER__-init` から作成する（`/__BRAND_LOWER__-init` または自然言語で呼び出し可）。

## 4. エージェント

| エージェント | パス | 役割 |
| --- | --- | --- |
| `context-router` | `.claude/agents/context-router.md` | 追加したい指示を Skills / Rules / AGENTS.md / CLAUDE.md のどこに置くべきか判定する |

## 5. Skills

| スキル | パス | 役割 |
| --- | --- | --- |
| `__BRAND_LOWER__-init` | `.claude/skills/__BRAND_LOWER__-init/SKILL.md` | 新規 Room を作成 |
| `__BRAND_LOWER__-list` | `.claude/skills/__BRAND_LOWER__-list/SKILL.md` | Room 一覧 |
| `__BRAND_LOWER__-status` | `.claude/skills/__BRAND_LOWER__-status/SKILL.md` | Kbrain と Room の状態確認 |

## 6. 言語

- ユーザーとの応答は日本語。
- 内部処理・コード・コメント・テストは英語のままで構わない（トークン効率優先）。
