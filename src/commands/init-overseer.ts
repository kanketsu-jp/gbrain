/**
 * `kbrain init-overseer` — ブランドルート直下に Overseer レジストリを作る。
 *
 * Phase A-3 MVP: `<root>/room/*` を走査し `.kbrain/` を持つディレクトリを
 * Room として登録する。レジストリは `<root>/.kbrain-overseer/config.json`。
 */

import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'fs';
import { basename, join, resolve } from 'path';

interface InitOverseerOptions {
  root: string;
  rooms: string[]; // glob 文字列。空配列なら自動検出
  force: boolean;
  jsonOutput: boolean;
}

function parseArgs(args: string[]): InitOverseerOptions {
  const rooms: string[] = [];
  let root: string | null = null;
  let force = false;
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--root') {
      root = args[++i] ?? null;
    } else if (a === '--rooms') {
      const val = args[++i];
      if (val) rooms.push(val);
    } else if (a === '--force') {
      force = true;
    } else if (a === '--json') {
      jsonOutput = true;
    }
  }

  if (!root) {
    console.error(
      'Usage: kbrain init-overseer --root <abs-path> [--rooms <glob>]... [--force] [--json]',
    );
    process.exit(1);
  }

  return {
    root: resolve(root),
    rooms,
    force,
    jsonOutput,
  };
}

/**
 * 非常に単純な glob 展開。`<dir>/*` または絶対ディレクトリパスのみサポート。
 * MVP ではこれで十分（仕様上のデフォルトは `<root>/room/*`）。
 */
function expandGlob(pattern: string): string[] {
  if (pattern.endsWith('/*')) {
    const parent = pattern.slice(0, -2);
    if (!existsSync(parent)) return [];
    const out: string[] = [];
    for (const entry of readdirSync(parent)) {
      const full = join(parent, entry);
      try {
        if (statSync(full).isDirectory()) out.push(full);
      } catch {
        /* skip */
      }
    }
    return out;
  }
  // glob でない場合はそのまま単一パスとして扱う
  return existsSync(pattern) && statSync(pattern).isDirectory() ? [pattern] : [];
}

interface RoomEntryOut {
  name: string;
  path: string;
  kbrain_home: string;
  db_path: string;
}

function discoverRooms(root: string, patterns: string[]): RoomEntryOut[] {
  const effective = patterns.length > 0 ? patterns : [join(root, 'room', '*')];
  const seen = new Set<string>();
  const rooms: RoomEntryOut[] = [];
  for (const pat of effective) {
    for (const dir of expandGlob(pat)) {
      const abs = resolve(dir);
      if (seen.has(abs)) continue;
      const kbrainHome = join(abs, '.kbrain');
      if (!existsSync(kbrainHome)) continue;
      try {
        if (!statSync(kbrainHome).isDirectory()) continue;
      } catch {
        continue;
      }
      seen.add(abs);
      rooms.push({
        name: basename(abs),
        path: abs,
        kbrain_home: kbrainHome,
        db_path: join(kbrainHome, 'brain.pglite'),
      });
    }
  }
  rooms.sort((a, b) => a.name.localeCompare(b.name));
  return rooms;
}

export async function runInitOverseer(args: string[]): Promise<void> {
  const opts = parseArgs(args);

  if (!existsSync(opts.root)) {
    console.error(`エラー: --root が存在しません: ${opts.root}`);
    process.exit(1);
  }
  if (!statSync(opts.root).isDirectory()) {
    console.error(`エラー: --root はディレクトリである必要があります: ${opts.root}`);
    process.exit(1);
  }

  const overseerDir = join(opts.root, '.kbrain-overseer');
  const configPath = join(overseerDir, 'config.json');

  if (existsSync(configPath) && !opts.force) {
    console.error(
      `エラー: 既に Overseer レジストリが存在します: ${configPath}\n` +
        `上書きするには --force を指定してください。`,
    );
    process.exit(1);
  }

  if (!existsSync(overseerDir)) {
    mkdirSync(overseerDir, { recursive: true });
  }

  const rooms = discoverRooms(opts.root, opts.rooms);
  const registry = {
    version: 1,
    root: opts.root,
    created_at: new Date().toISOString(),
    rooms,
  };

  writeFileSync(configPath, JSON.stringify(registry, null, 2) + '\n', 'utf8');

  if (opts.jsonOutput) {
    console.log(JSON.stringify({ ok: true, config: configPath, registry }, null, 2));
    return;
  }

  console.log(`Overseer レジストリを作成しました: ${configPath}`);
  console.log(`ブランドルート: ${opts.root}`);
  console.log(`登録 Room 数: ${rooms.length}`);
  for (const r of rooms) {
    console.log(`  - ${r.name}  (${r.path})`);
  }
  if (rooms.length === 0) {
    console.log('');
    console.log('注意: Room が 1 件も見つかりませんでした。');
    console.log('  - `<root>/room/<name>/.kbrain/` が存在するか確認してください。');
    console.log('  - 必要なら `kbrain init-room --path <abs>` で Room を作成してください。');
  }
}
