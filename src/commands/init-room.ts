import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from 'fs';
import { dirname, join, resolve, relative, basename } from 'path';
import { fileURLToPath } from 'url';
import { t } from '../core/messages.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface InitRoomOptions {
  path: string;
  name: string;
  parentBrand: string;
  nonInteractive: boolean;
  jsonOutput: boolean;
}

function parseArgs(args: string[]): InitRoomOptions {
  const pathIdx = args.indexOf('--path');
  const nameIdx = args.indexOf('--name');
  const parentIdx = args.indexOf('--parent-brand');
  const rawPath = pathIdx !== -1 ? args[pathIdx + 1] : null;
  if (!rawPath) {
    console.error(t('init-room.usage'));
    process.exit(1);
  }
  const roomPath = resolve(rawPath);
  const roomName = nameIdx !== -1 ? args[nameIdx + 1] : basename(roomPath);
  const parentBrand = parentIdx !== -1 ? args[parentIdx + 1] : 'KK2AI';
  return {
    path: roomPath,
    name: roomName,
    parentBrand,
    nonInteractive: args.includes('--non-interactive'),
    jsonOutput: args.includes('--json'),
  };
}

function templateDir(): string {
  return resolve(__dirname, '..', '..', 'templates', 'room');
}

function isTemplateFile(name: string): boolean {
  return name.endsWith('.tpl');
}

function strippedName(name: string): string {
  return name.endsWith('.tpl') ? name.slice(0, -4) : name;
}

function renderTemplate(content: string, vars: Record<string, string>): string {
  return content.replace(/__([A-Z_]+)__/g, (m, key) => {
    return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : m;
  });
}

function copyTemplateTree(srcRoot: string, dstRoot: string, vars: Record<string, string>) {
  const stack: Array<{ src: string; dst: string }> = [{ src: srcRoot, dst: dstRoot }];
  while (stack.length) {
    const { src, dst } = stack.pop()!;
    if (!existsSync(dst)) mkdirSync(dst, { recursive: true });
    for (const entry of readdirSync(src)) {
      const srcPath = join(src, entry);
      const dstName = strippedName(entry);
      const dstPath = join(dst, dstName);
      const st = statSync(srcPath);
      if (st.isDirectory()) {
        stack.push({ src: srcPath, dst: dstPath });
        continue;
      }
      const raw = readFileSync(srcPath, 'utf8');
      const out = isTemplateFile(entry) ? renderTemplate(raw, vars) : raw;
      writeFileSync(dstPath, out);
    }
  }
}

export async function runInitRoom(args: string[]) {
  const opts = parseArgs(args);
  const kbrainDir = join(opts.path, '.kbrain');
  const dbPath = join(kbrainDir, 'brain.pglite');

  if (existsSync(kbrainDir) && !args.includes('--force')) {
    console.error(t('init-room.error.already_initialised', { path: kbrainDir }));
    process.exit(1);
  }

  mkdirSync(opts.path, { recursive: true });
  mkdirSync(kbrainDir, { recursive: true });
  mkdirSync(join(kbrainDir, 'pages'), { recursive: true });
  mkdirSync(join(opts.path, '.temp'), { recursive: true });

  const vars: Record<string, string> = {
    ROOM_NAME: opts.name,
    ROOM_PATH: opts.path,
    CREATED_AT: new Date().toISOString(),
    PARENT_BRAND: opts.parentBrand,
  };

  const tplRoot = templateDir();
  if (existsSync(tplRoot)) {
    copyTemplateTree(tplRoot, opts.path, vars);
  } else {
    console.error(t('init-room.error.template_missing', { path: tplRoot }));
  }

  const originalHome = process.env.GBRAIN_HOME;
  const originalLang = process.env.KBRAIN_LANG;
  process.env.GBRAIN_HOME = kbrainDir;
  if (!originalLang) process.env.KBRAIN_LANG = 'ja';
  try {
    const { runInit } = await import('./init.ts');
    const initArgs: string[] = ['--pglite', '--path', dbPath];
    if (opts.nonInteractive) initArgs.push('--non-interactive');
    if (opts.jsonOutput) initArgs.push('--json');
    await runInit(initArgs);
  } finally {
    if (originalHome === undefined) delete process.env.GBRAIN_HOME;
    else process.env.GBRAIN_HOME = originalHome;
    if (originalLang === undefined) delete process.env.KBRAIN_LANG;
    else process.env.KBRAIN_LANG = originalLang;
  }

  if (opts.jsonOutput) {
    console.log(JSON.stringify({
      status: 'ok',
      room: { name: opts.name, path: opts.path, kbrain_home: kbrainDir, db_path: dbPath },
    }));
  } else {
    const rel = relative(process.cwd(), opts.path) || opts.path;
    console.log(t('init-room.done.title', { name: opts.name, path: rel }));
    console.log(t('init-room.done.kbrain_dir', { rel: relative(opts.path, kbrainDir) }));
    console.log(t('init-room.done.db_path', { rel: relative(opts.path, dbPath) }));
    console.log('');
    console.log(t('init-room.done.next_hint'));
    console.log(t('init-room.done.next_cmd', { path: opts.path }));
  }
}
