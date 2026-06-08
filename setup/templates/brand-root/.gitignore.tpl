# Temporary scratch — see .claude/rules/temp-dir.md
# 明示的に追跡したい場合は各階層の .gitignore で `!.temp/<path>` を指定する。
.temp/
**/.temp/

# Overseer (横断モード) のローカル状態。共有不要。
.kbrain-overseer/

# OS / editor
.DS_Store
Thumbs.db
.idea/
.vscode/

# Node / package managers
node_modules/
.pnpm-store/
.npm/

# Logs
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
yarn-error.log*

# Env
.env
.env.*
!.env.example
