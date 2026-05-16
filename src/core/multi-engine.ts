/**
 * Multi-engine MVP for Kbrain Overseer.
 *
 * Phase A-3 では「複数 Room の DB を横断参照する」仕組みの足場を用意するだけ。
 * 実際の federated search 実装（PGLite を Room ごとに開いて operations.search を
 * 呼ぶ等）は将来タスクで対応する。ここでは型定義とレジストリ I/O、ステータス
 * 取得のみを提供する。
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';

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

/**
 * 複数 Room を横断する federated search のスタブ。
 *
 * 将来実装メモ:
 *   - `../core/engine-factory.ts` の `createEngine()` を Room ごとに read-only で生成
 *   - 各エンジンで `operations.search(query, opts)` を呼んで結果を統合
 *   - スコアリングは Room 間で正規化（rank fusion or score normalization）
 *   - 並列実行はあるが Room ごとの DB open は重いので Limited Concurrency を検討
 *   - 結果には Room 名・元 page id を必ず添える
 *
 * MVP では呼ばれたことを示すマーカーオブジェクトを返すのみ。
 */
export async function aggregateSearch(
  reg: Registry,
  query: string,
  _opts?: { limit?: number },
): Promise<{ todo: 'not_implemented'; query: string; rooms: string[] }> {
  return {
    todo: 'not_implemented',
    query,
    rooms: reg.rooms.map((r) => r.name),
  };
}
