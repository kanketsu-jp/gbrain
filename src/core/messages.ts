import en from '../messages/en.json' with { type: 'json' };
import ja from '../messages/ja.json' with { type: 'json' };

type Dict = Record<string, string>;

const dictionaries: Record<string, Dict> = {
  en: en as Dict,
  ja: ja as Dict,
};

function currentLang(): string {
  const lang = process.env.KBRAIN_LANG || 'en';
  return dictionaries[lang] ? lang : 'en';
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const lang = currentLang();
  const dict = dictionaries[lang] || dictionaries.en;
  const raw = dict[key];
  if (raw === undefined) {
    return `[missing:${key}]`;
  }
  if (!vars) return raw;
  return raw.replace(/\{([a-zA-Z0-9_]+)\}/g, (m, name) => {
    if (Object.prototype.hasOwnProperty.call(vars, name)) {
      return String(vars[name]);
    }
    return m;
  });
}
