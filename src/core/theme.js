/**
 * 明暗主题
 * 存储键 mp-theme：'light' | 'dark' | 'system'
 */
const KEY = 'mp-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';
const listeners = new Set();

export function resolveTheme(pref) {
  if (pref === 'light' || pref === 'dark') return pref;
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

export function currentPref() {
  try {
    return localStorage.getItem(KEY) || 'system';
  } catch {
    return 'system';
  }
}

export function currentTheme() {
  return document.documentElement.dataset.theme || 'light';
}

export function applyTheme(pref) {
  const theme = resolveTheme(pref);
  document.documentElement.dataset.theme = theme;
  listeners.forEach((fn) => fn(theme));
}

export function setTheme(pref) {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    /* 隐私模式下忽略 */
  }
  applyTheme(pref);
}

/** 点击切换：在 light / dark 之间翻转（会脱离 system 跟随） */
export function toggleTheme() {
  setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
}

export function onThemeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * 应用站点级主题配置：
 * - theme.default：首次访问（无本地偏好）时的默认主题
 * - theme.accent：覆盖全局强调色
 */
export function applySiteTheme(site = {}) {
  const cfg = site.theme || {};
  if (cfg.accent) {
    document.documentElement.style.setProperty('--accent', cfg.accent);
  }
  const stored = (() => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  })();
  applyTheme(stored || cfg.default || 'system');
}

/** 跟随系统：仅在偏好为 system 时生效 */
export function initSystemWatch() {
  const mq = window.matchMedia(DARK_QUERY);
  const handler = () => {
    if (currentPref() === 'system') applyTheme('system');
  };
  mq.addEventListener?.('change', handler);
}
