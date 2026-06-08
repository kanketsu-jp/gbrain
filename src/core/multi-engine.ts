/**
 * Multi-engine for Kbrain Overseer.
 *
 * Phase A-3 の federated search 本実装。各 Room の PGLite (または Postgres) を
 * 1つずつ open し、gbrain `operations.search` を呼んで結果を統合する。
 *
 * 設計メモ:
 *   - Room ごとの DB open はそれなりに重いので、シンプルさと PGLite の安全性を
 *     優先して **逐次** で回す。並列化したいなら将来 p-limit 等で導入する。
 *   - GBRAIN_HOME を Room ごとに差し替えて loadConfig() を回す。呼び出し前後で
 *     env を保存/復元するので、上位呼び出し元から見れば副作用なし。
 *   - 結果には Room 名を必ず付与する。score 降順で並べ、limit で切る。
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';

import { createEngine } from './engine-factory.ts';
import { loadConfig, loadConfigWithEngine, toEngineConfig } from './config.ts';
import { operations } from './operations.ts';
import type { Operation, OperationContext } from './operations.ts';
import type { BrainEngine } from './engine.ts';

export interface RoomEntry {
  name: string;
  path: string;
  kbrain_home: string;
  db_path: string;
}

export interface Registry {
  version: number;
  root: string;
  rooms: RoomEntry[];
  created_at: string;
}

export interface RoomStatus {
  name: string;
  path: string;
  db_path: string;
  exists: boolean;
  size: number | null;
  mtime: string | null;
}

const REGISTRY_DIR = '.kbrain-overseer';
const REGISTRY_FILE = 'config.json';

/**
 * 指定された root（通常は CWD）から `.kbrain-overseer/config.json` を読み込む。
 * 見つからない/壊れている場合は例外を投げる。呼び出し側で適切に案内すること。
 */
export function loadOverseerRegistry(rootPath: string): Registry {
  const abs = resolve(rootPath);
  const configPath = join(abs, REGISTRY_DIR, REGISTRY_FILE);
  if (!existsSync(configPath)) {
    throw new Error(
      `Overseer レジストリが見つかりません: ${configPath}\n` +
        `先に \`kbrain init-overseer --root <abs>\` を実行してください。`,
    );
  }
  const raw = readFileSync(configPath, 'utf8');
  let parsed: Registry;
  try {
    parsed = JSON.parse(raw) as Registry;
  } catch (e) {
    throw new Error(`Overseer レジストリのパースに失敗しました: ${configPath}: ${(e as Error).message}`);
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.rooms)) {
    throw new Error(`Overseer レジストリの形式が不正です: ${configPath}`);
  }
  return parsed;
}

/**
 * 各 Room の DB ファイルの mtime/size を取得する。read-only。
 * DB を実際に open することはしない（PGLite 起動コストを避けるため）。
 */
export async function listRoomStatus(reg: Registry): Promise<RoomStatus[]> {
  const out: RoomStatus[] = [];
  for (const room of reg.rooms) {
    const dbPath = room.db_path;
    let exists = false;
    let size: number | null = null;
    let mtime: string | null = null;
    try {
      if (existsSync(dbPath)) {
        const st = statSync(dbPath);
        exists = true;
        size = st.size;
        mtime = new Date(st.mtimeMs).toISOString();
      }
    } catch {
      // 取得失敗時はそのまま exists=false で返す
    }
    out.push({
      name: room.name,
      path: room.path,
      db_path: dbPath,
      exists,
      size,
      mtime,
    });
  }
  return out;
}

export interface AggregateSearchResult {
  query: string;
  /** 走査対象として登録されていた Room 名（成否問わず全列挙）。 */
  rooms: string[];
  /** 各 hit。score 降順、limit で切ったあとの最終結果。各要素に `room` を持つ。 */
  results: Array<Record<string, unknown> & { room: string; score?: number }>;
  /** Room 単位で発生したエラー（DB 未初期化など）。0件なら省略。 */
  errors?: Array<{ room: string; message: string }>;
}

function findSearchOp(): Operation {
  // cliHints.name === 'search' か op.name === 'search' で同定。
  const op = operations.find(
    (o) => o.name === 'search' || o.cliHints?.name === 'search',
  );
  if (!op) {
    throw new Error('search operation が operations registry に見つかりません。gbrain 側の構成を確認してください。');
  }
  return op;
}

function buildOverseerContext(engine: BrainEngine, config: unknown): OperationContext {
  return {
    engine,
    // loadConfigWithEngine() の戻り値をそのまま OperationContext.config に。
    // search ハンドラは config を eval 設定くらいしか参照しないので緩めにキャスト。
    config: (config ?? { engine: 'pglite' }) as OperationContext['config'],
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    dryRun: false,
    remote: false,
    // v0.34 D4: sourceId は型レベル必須。単一 Room 内は 'default' で固定。
    sourceId: 'default',
  };
}

/**
 * 複数 Room を横断する federated search の本実装。
 *
 * 各 Room について GBRAIN_HOME を切り替え、PGLite (or Postgres) を open し、
 * gbrain の `search` op を呼んで結果を集める。1 Room ずつ逐次処理する。
 * 結果は room 名を付与して score 降順でソートし、`limit` で切って返す。
 */
export async function aggregateSearch(
  reg: Registry,
  query: string,
  opts?: { limit?: number; timeoutMs?: number },
): Promise<AggregateSearchResult> {
  const limit = opts?.limit ?? 20;
  const searchOp = findSearchOp();

  const allHits: Array<Record<string, unknown> & { room: string; score?: number }> = [];
  const errors: Array<{ room: string; message: string }> = [];

  // GBRAIN_HOME を都度差し替える都合上、Room ごとの呼び出しは逐次に固定する。
  // PGLite の WASM 安全性 + env 切り替えの素朴さを優先。
  const prevGbrainHome = process.env.GBRAIN_HOME;

  for (const room of reg.rooms) {
    process.env.GBRAIN_HOME = room.kbrain_home;
    let engine: BrainEngine | null = null;
    try {
      const fileConfig = loadConfig();
      if (!fileConfig) {
        throw new Error(`Room "${room.name}" の gbrain config が見つかりません (GBRAIN_HOME=${room.kbrain_home}).`);
      }
      engine = await createEngine(toEngineConfig(fileConfig));
      await engine.connect(toEngineConfig(fileConfig));
      // DB プレーン込みの config を再ロード（embedding flags など runtime 設定）。
      const mergedConfig = await loadConfigWithEngine(engine, fileConfig);

      const ctx = buildOverseerContext(engine, mergedConfig ?? fileConfig);
      const raw = await searchOp.handler(ctx, { query, limit });
      const hits = Array.isArray(raw) ? raw : [];

      for (const h of hits) {
        if (h && typeof h === 'object') {
          allHits.push({ ...(h as Record<string, unknown>), room: room.name });
        }
      }
    } catch (e) {
      errors.push({ room: room.name, message: (e as Error).message });
    } finally {
      if (engine) {
        try {
          await engine.disconnect();
        } catch {
          // disconnect 失敗は致命ではない（プロセス終了で解放される）。
        }
      }
      // env を復元。次の Room or 呼び出し元のために必ず戻す。
      if (prevGbrainHome === undefined) {
        delete process.env.GBRAIN_HOME;
      } else {
        process.env.GBRAIN_HOME = prevGbrainHome;
      }
    }
  }

  // score 降順でソート。score が無い hit は 0 扱い。
  allHits.sort((a, b) => {
    const sa = typeof a.score === 'number' ? a.score : 0;
    const sb = typeof b.score === 'number' ? b.score : 0;
    return sb - sa;
  });

  const trimmed = allHits.slice(0, limit);

  const out: AggregateSearchResult = {
    query,
    rooms: reg.rooms.map((r) => r.name),
    results: trimmed,
  };
  if (errors.length > 0) out.errors = errors;
  return out;
}
