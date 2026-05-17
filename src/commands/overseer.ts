/**
 * `kbrain overseer <subcommand>` — Overseer レジストリ操作。
 *
 * Phase A-3 MVP のサブコマンド:
 *   - list / rooms : 登録 Room とその DB の状態を表示
 *   - search <q>   : federated search のスタブ（aggregateSearch を呼ぶだけ）
 *   - status       : レジストリの存在と Room 数のみを表示
 *
 * レジストリは CWD 起点で `.kbrain-overseer/config.json` を探す。
 */

import { existsSync } from 'fs';
import { join } from 'path';

import {
  aggregateSearch,
  listRoomStatus,
  loadOverseerRegistry,
} from '../core/multi-engine.ts';

function formatBytes(size: number | null): string {
  if (size === null) return '-';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function printUsage(): void {
  console.error('Usage:');
  console.error('  kbrain overseer list');
  console.error('  kbrain overseer rooms');
  console.error('  kbrain overseer search <query> [--limit <n>] [--json]');
  console.error('  kbrain overseer status');
}

function registryPathFromCwd(): string {
  return join(process.cwd(), '.kbrain-overseer', 'config.json');
}

function ensureRegistryOrExit() {
  const path = registryPathFromCwd();
  if (!existsSync(path)) {
    console.error(`Overseer レジストリが見つかりません: ${path}`);
    console.error('先に \`kbrain init-overseer --root <abs>\` を実行してください。');
    process.exit(1);
  }
  try {
    return loadOverseerRegistry(process.cwd());
  } catch (e) {
    console.error(`エラー: ${(e as Error).message}`);
    process.exit(1);
  }
}

async function runList(): Promise<void> {
  const reg = ensureRegistryOrExit();
  const statuses = await listRoomStatus(reg);
  console.log(`Overseer ブランドルート: ${reg.root}`);
  console.log(`登録 Room 数: ${reg.rooms.length}`);
  console.log('');
  if (statuses.length === 0) {
    console.log('(Room が登録されていません)');
    return;
  }
  for (const s of statuses) {
    console.log(`- ${s.name}`);
    console.log(`    path   : ${s.path}`);
    console.log(`    db     : ${s.db_path}`);
    if (s.exists) {
      console.log(`    size   : ${formatBytes(s.size)}`);
      console.log(`    mtime  : ${s.mtime}`);
    } else {
      console.log('    status : (DB ファイルなし — まだ init されていない可能性)');
    }
  }
}

async function runStatus(): Promise<void> {
  const path = registryPathFromCwd();
  if (!existsSync(path)) {
    console.log('Overseer: 未初期化');
    console.log(`  レジストリ予定先: ${path}`);
    console.log('  `kbrain init-overseer --root <abs>` を実行してください。');
    return;
  }
  const reg = ensureRegistryOrExit();
  console.log('Overseer: 初期化済み');
  console.log(`  レジストリ : ${path}`);
  console.log(`  root       : ${reg.root}`);
  console.log(`  rooms      : ${reg.rooms.length}`);
  console.log(`  created_at : ${reg.created_at}`);
}

function pickSnippet(hit: Record<string, unknown>): string {
  // 候補キーを優先順に。最初に文字列が見つかったものを使う。
  const candidates = ['snippet', 'chunk_text', 'title', 'compiled_truth', 'content', 'summary'];
  for (const k of candidates) {
    const v = hit[k];
    if (typeof v === 'string' && v.length > 0) {
      const oneLine = v.replace(/\s+/g, ' ').trim();
      return oneLine.length > 120 ? oneLine.slice(0, 117) + '...' : oneLine;
    }
  }
  return '';
}

function pickSourceId(hit: Record<string, unknown>): string {
  const candidates = ['slug', 'page_slug', 'source_id', 'page_id', 'id'];
  for (const k of candidates) {
    const v = hit[k];
    if (typeof v === 'string' && v.length > 0) return v;
    if (typeof v === 'number') return String(v);
  }
  return '?';
}

async function runSearch(args: string[]): Promise<void> {
  // --json / --limit <n> を抜き出して残りを query にする。
  let asJson = false;
  let limit: number | undefined;
  const rest: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--json') {
      asJson = true;
    } else if (a === '--limit' && i + 1 < args.length) {
      limit = Number(args[++i]);
    } else {
      rest.push(a);
    }
  }
  const query = rest.join(' ').trim();
  if (!query) {
    console.error('Usage: kbrain overseer search <query> [--limit <n>] [--json]');
    process.exit(1);
  }
  const reg = ensureRegistryOrExit();
  const result = await aggregateSearch(reg, query, { limit });

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`query  : ${result.query}`);
  console.log(`rooms  : ${result.rooms.length === 0 ? '(なし)' : result.rooms.join(', ')}`);
  console.log(`hits   : ${result.results.length}`);
  console.log('');

  if (result.results.length === 0) {
    console.log('(該当なし)');
  } else {
    for (const hit of result.results) {
      const score = typeof hit.score === 'number' ? hit.score.toFixed(4) : '?';
      const id = pickSourceId(hit);
      const snippet = pickSnippet(hit);
      console.log(`[${score}] ${hit.room}/${id}${snippet ? ' -- ' + snippet : ''}`);
    }
  }

  if (result.errors && result.errors.length > 0) {
    console.log('');
    console.log('warnings:');
    for (const e of result.errors) {
      console.log(`  - ${e.room}: ${e.message}`);
    }
  }
}

export async function runOverseer(args: string[]): Promise<void> {
  const sub = args[0];
  const rest = args.slice(1);
  if (!sub || sub === '--help' || sub === '-h') {
    printUsage();
    process.exit(sub ? 0 : 1);
  }
  switch (sub) {
    case 'list':
    case 'rooms':
      await runList();
      return;
    case 'status':
      await runStatus();
      return;
    case 'search':
      await runSearch(rest);
      return;
    default:
      console.error(`Unknown subcommand: ${sub}`);
      printUsage();
      process.exit(1);
  }
}
