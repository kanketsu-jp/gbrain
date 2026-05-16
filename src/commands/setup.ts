import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from 'fs';
import { dirname, join, resolve, relative } from 'path';
import { fileURLToPath } from 'url';
import { t } from '../core/messages.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SetupOptions {
  path: string;
  brandUpper: string;
  brandLower: string;
  brandDisplay: string;
  force: boolean;
  jsonOutput: boolean;
}

function templateRoot(): string {
  return resolve(__dirname, '..', '..', 'setup', 'templates', 'brand-root');
}

function parseArgs(args: string[]): SetupOptions {
  const pathIdx = args.indexOf('--path');
  const brandIdx = args.indexOf('--brand');
  const lowerIdx = args.indexOf('--lower');
  const displayIdx = args.indexOf('--display');
  const rawPath = pathIdx !== -1 ? args[pathIdx + 1] : null;
  const rawBrand = brandIdx !== -1 ? args[brandIdx + 1] : null;
  if (!rawPath || !rawBrand) {
    console.error(t('setup.usage'));
    process.exit(1);
  }
  const brandUpper = rawBrand;
  const brandLower = lowerIdx !== -1 ? args[lowerIdx + 1] : rawBrand.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const brandDisplay = displayIdx !== -1 ? args[displayIdx + 1] : rawBrand;
  return {
    path: resolve(rawPath),
    brandUpper,
    brandLower,
    brandDisplay,
    force: args.includes('--force'),
    jsonOutput: args.includes('--json'),
  };
}

function renderString(input: string, vars: Record<string, string>): string {
  return input.replace(/__([A-Z_]+)__/g, (m, key) => {
    return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : m;
  });
}

function stripTplSuffix(name: string): string {
  return name.endsWith('.tpl') ? name.slice(0, -4) : name;
}

function copyTreeWithRename(src: string, dst: string, vars: Record<string, string>) {
  if (!existsSync(dst)) mkdirSync(dst, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const renderedName = renderString(stripTplSuffix(entry), vars);
    const dstPath = join(dst, renderedName);
    const st = statSync(srcPath);
    if (st.isDirectory()) {
      copyTreeWithRename(srcPath, dstPath, vars);
      continue;
    }
    const raw = readFileSync(srcPath, 'utf8');
    const out = entry.endsWith('.tpl') ? renderString(raw, vars) : raw;
    writeFileSync(dstPath, out);
  }
}

export async function runSetup(args: string[]) {
  const opts = parseArgs(args);
  const tpl = templateRoot();
  if (!existsSync(tpl)) {
    console.error(t('setup.error.template_missing', { path: tpl }));
    process.exit(1);
  }

  const agentsMd = join(opts.path, 'AGENTS.md');
  if (existsSync(agentsMd) && !opts.force) {
    console.error(t('setup.error.agents_md_exists', { path: agentsMd }));
    process.exit(1);
  }

  mkdirSync(opts.path, { recursive: true });

  const vars: Record<string, string> = {
    BRAND_UPPER: opts.brandUpper,
    BRAND_LOWER: opts.brandLower,
    BRAND_DISPLAY: opts.brandDisplay,
    BRAND_PATH: opts.path,
  };

  copyTreeWithRename(tpl, opts.path, vars);

  // Ensure auxiliary dirs.
  mkdirSync(join(opts.path, 'room'), { recursive: true });
  mkdirSync(join(opts.path, '.temp'), { recursive: true });

  if (opts.jsonOutput) {
    console.log(JSON.stringify({
      status: 'ok',
      brand: { upper: opts.brandUpper, lower: opts.brandLower, display: opts.brandDisplay },
      path: opts.path,
    }));
    return;
  }

  const rel = relative(process.cwd(), opts.path) || opts.path;
  console.log(t('setup.done.title', { display: opts.brandDisplay, rel }));
  console.log('');
  console.log(t('setup.done.generated_header'));
  console.log(t('setup.done.line_agents'));
  console.log(t('setup.done.line_rules'));
  console.log(t('setup.done.line_agents_dir'));
  console.log(t('setup.done.line_skills', { lower: opts.brandLower }));
  console.log(t('setup.done.line_room'));
  console.log('');
  console.log(t('setup.done.next_header'));
  console.log(t('setup.done.next_cd', { path: opts.path }));
  console.log(t('setup.done.next_skill_hint', { lower: opts.brandLower }));
  console.log(t('setup.done.next_cli_hint', { display: opts.brandDisplay }));
}
