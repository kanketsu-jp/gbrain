# Kbrain ブランドルート セットアップ

Kbrain 配布物（zip / git clone）から、**任意のブランド名のルートディレクトリ**を一発生成するためのスクリプトとテンプレ群。

## 概要

このディレクトリは Kbrain の「ブランドジェネレータ」です。`kbrain setup` コマンド（または `install.sh`）を叩くと、`__BRAND_DISPLAY__` ルート（KK2AI / TANAKA-AI など）と等価なディレクトリ構成を、指定したパスに生成します。

生成される雛形：

```
<target>/
├── AGENTS.md
├── CLAUDE.md
├── .gitignore
├── .claude/
│   ├── rules/        (root-directory, inheritance, temp-dir, agents-md-update, room-directory)
│   ├── agents/       (context-router)
│   └── skills/       (<brand-lower>-init / -list / -status)
├── room/             (空。Room はここに作成されます)
└── .temp/            (空)
```

## 使い方

### 推奨: install.sh

zip 配布の場合、展開後にこのディレクトリで実行：

```bash
./setup/install.sh --brand KK2AI --path ~/Develop/Projects/KK2AI
./setup/install.sh --brand TANAKA-AI --path ~/Develop/Projects/TANAKA-AI
```

`install.sh` は `kbrain` CLI が無ければ自動で `bun install && bun link` を試みます（bun が必要）。

### 直接: kbrain setup

CLI が既に入っている場合：

```bash
kbrain setup --brand KK2AI --path ~/Develop/Projects/KK2AI
```

### 引数

| 引数 | 必須 | 意味 |
| --- | --- | --- |
| `--brand <UPPER>` | ✔ | ブランド大文字（KK2AI, TANAKA-AI など） |
| `--path <abs>` | ✔ | セットアップ先の絶対パス |
| `--lower <lower>` |  | ブランド小文字（デフォルト: `--brand` を小文字化） |
| `--display <display>` |  | 表示名（デフォルト: `--brand` と同じ） |
| `--force` |  | 既存 `AGENTS.md` を上書き |
| `--json` |  | JSON で結果出力 |

## 動作

1. `setup/templates/brand-root/` を再帰的に走査
2. ファイル名・ディレクトリ名のプレースホルダを置換
   - `__BRAND_UPPER__`、`__BRAND_LOWER__`
3. `.tpl` 拡張子のファイルは中身も置換
   - `__BRAND_UPPER__`、`__BRAND_LOWER__`、`__BRAND_DISPLAY__`、`__BRAND_PATH__`
4. `.tpl` 拡張子は剥がして書き出し
5. 補助ディレクトリ (`room/`, `.temp/`) を作成

## 既存ルートの再生成

`--force` を付けると上書きします。再生成前に必ず `AGENTS.md` などを `.temp/before-bootstrap/` 等に退避してください。

```bash
mkdir -p .temp/before-bootstrap
cp -r AGENTS.md CLAUDE.md .gitignore .claude .temp/before-bootstrap/
kbrain setup --brand KK2AI --path "$(pwd)" --force
diff -ru .temp/before-bootstrap/.claude .claude
```
