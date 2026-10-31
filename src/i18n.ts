export type Locale = 'en' | 'zh';

type MessageKey =
  | 'title'
  | 'baseLabel'
  | 'stat'
  | 'bonusLabel'
  | 'hintP1'
  | 'hintP2'
  | 'footer'
  | 'winner'
  | 'restart';

const DEFAULT_LOCALE: Locale = 'en';

const MESSAGES: Record<Locale, Record<MessageKey, string>> = {
  en: {
    title: 'Neuro Tower Defense · VEP Attention Battle',
    baseLabel: '{player} BASE   HP {hp}',
    stat: 'HP {hp} · DMG {damage}',
    bonusLabel: 'REINFORCEMENT',
    hintP1: 'P1 · Hold mouse or 1 / 2 / 3 · 4 = reinforcement',
    hintP2: 'P2 · Hold mouse or 7 / 8 / 9 · 0 = reinforcement',
    footer: 'F flicker · D frequency labels · R restart',
    winner: '{player} WINS',
    restart: 'Press R to restart',
  },
  zh: {
    title: '神经塔防 · VEP 注意力对战',
    baseLabel: '{player} 据点   HP {hp}',
    stat: '生命 {hp} · 伤害 {damage}',
    bonusLabel: '增援',
    hintP1: 'P1 · 按住鼠标或键 1 / 2 / 3 · 4 为增援',
    hintP2: 'P2 · 按住鼠标或键 7 / 8 / 9 · 0 为增援',
    footer: 'F 闪烁开关 · D 频率标签 · R 重新开始',
    winner: '{player} 胜利',
    restart: '按 R 重新开始',
  },
};

function detectLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const lang = new URLSearchParams(window.location.search).get('lang');
  return lang === 'zh' ? 'zh' : DEFAULT_LOCALE;
}

const locale: Locale = detectLocale();

export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  let text = MESSAGES[locale][key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

export function currentLocale(): Locale {
  return locale;
}

export function applyDocumentLocale(): void {
  document.documentElement.lang = locale;
  document.title = t('title');
}
