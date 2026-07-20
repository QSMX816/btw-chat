import { useConfig } from '../stores/config';
import { translations, type Lang } from './translations';

export function detectLang(): Lang {
  const l = (typeof navigator !== 'undefined' ? navigator.language : 'zh').toLowerCase();
  return l.startsWith('zh') ? 'zh' : 'en';
}

export function resolveLang(setting: string | undefined): Lang {
  return setting === 'en' ? 'en' : setting === 'zh' ? 'zh' : detectLang();
}

export function useT() {
  const { settings } = useConfig();
  const lang = resolveLang(settings.language);
  return { lang, t: translations[lang] };
}

const USD_TO_CNY = 7.2;

export function formatCost(amountUsd: number, lang: Lang): string {
  if (!isFinite(amountUsd) || amountUsd <= 0) return '';
  if (lang === 'zh') {
    const cny = amountUsd * USD_TO_CNY;
    return '¥' + (cny < 0.01 ? cny.toFixed(4) : cny < 1 ? cny.toFixed(3) : cny.toFixed(2));
  }
  return '$' + (amountUsd < 0.01 ? amountUsd.toFixed(4) : amountUsd < 1 ? amountUsd.toFixed(3) : amountUsd.toFixed(2));
}

export function formatPricePerM(usd: number, lang: Lang): string {
  if (!usd) return '';
  if (lang === 'zh') return '¥' + (usd * USD_TO_CNY).toFixed(2) + '/M';
  return '$' + usd.toFixed(2) + '/M';
}
