# Upstream Sync — garrytan/gbrain 追従手順

このフォークは garrytan/gbrain の非破壊スーパーセット。Kbrain 拡張 (Room/Overseer/setup/i18n) を維持しつつ upstream を定期的に取り込む。

## Remote 構成
- origin = kanketsu-jp/gbrain (フォーク先、本リポジトリ)
- upstream = garrytan/gbrain (大元)

## 手順
1. `git fetch upstream`
2. master を upstream に合わせる: `git checkout master && git merge upstream/master`
3. Kbrain拡張ブランチに rebase 適用: `git checkout feat/kbrain-kk2ai-extensions && git rebase master`
4. 衝突しやすい場所:
   - src/cli.ts (CLI_ONLY set、handleCliOnly 内の分岐)
   - package.json (bin alias)
   - .gitignore (templates 配下の除外解除行)
5. 上記以外の Kbrain拡張ファイル (templates/room/, setup/, src/commands/init-room.ts 等) は新規追加なので衝突しない
6. テスト: `bun install && bun run typecheck`、Room生成 smoke test

## AI による追従の自動化（将来）
Claude/Codex のサブエージェントに以下を任せる:
- `git fetch upstream && git log master..upstream/master --oneline` で差分を取得
- 差分 commit を読み、Kbrain拡張と衝突するかを評価
- 衝突箇所をリストアップして人間に提示、または rebase を試みて 95% 自動マージ

実行例:
```bash
# Claude Code から:
# 「最新の garrytan/gbrain を取り込みたい」と依頼すると、Claude が:
#   1. git fetch upstream
#   2. git log を解析
#   3. 衝突予測を出力
#   4. ユーザー承認後に rebase 実行
```

## 注意
- 大きな破壊変更（postinstall 改名、bin alias変更など）が来た場合は手動マージ
- 本フォークから upstream に PR を出す予定がある場合、Kbrain 拡張は別ブランチに分離してから出す
