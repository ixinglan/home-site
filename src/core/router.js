/**
 * 极简 hash 路由
 * - #/product/<id>  打开产品详情抽屉
 * - 其它            首页
 * 用 hash 是为了让 nginx 不需要任何 rewrite 规则，也不会刷新 404。
 */
const listeners = new Set();
let current = { name: 'home', id: null };

export function parseHash(hash = location.hash) {
  const raw = String(hash || '').replace(/^#\/?/, '');
  const m = raw.match(/^product\/([^/?#]+)/);
  if (m) return { name: 'product', id: decodeURIComponent(m[1]) };
  return { name: 'home', id: null };
}

function emit() {
  const next = parseHash();
  const changed = next.name !== current.name || next.id !== current.id;
  current = next;
  if (changed || true) listeners.forEach((fn) => fn(current));
}

export function onRoute(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function startRouter() {
  window.addEventListener('hashchange', emit);
  emit();
}

export function goProduct(id) {
  location.hash = `#/product/${encodeURIComponent(id)}`;
}

/** 回到首页：用 replaceState 清掉 hash，避免留下 '#' 污染地址栏 */
export function goHome() {
  if (!location.hash) {
    emit();
    return;
  }
  const url = `${location.pathname}${location.search}`;
  history.replaceState(null, '', url);
  emit();
}

export const currentRoute = () => current;
