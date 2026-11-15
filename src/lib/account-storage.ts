import {emptyProgressData, parseProgressData, type ProgressData} from './account-data';
type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>;
export function createAccountStorage(storage: Storage, adapter: {read: () => ProgressData; write: (data: ProgressData) => void; beforeSwitch?: (id: string | null) => void}, browser: ProgressData) {
  let owner: string | null = null; let applying = false;
  let local = parseProgressData(browser);
  const key = (id: string) => `nhaikanji-account-v1:${id}`;
  const flush = () => {if (applying) return; const value = parseProgressData(adapter.read()); if (owner) storage.setItem(key(owner), JSON.stringify(value)); else local = value;};
  return {
    flush,
    get owner() {return owner;},
    get version() {const value = owner ? Number(storage.getItem(`${key(owner)}:version`)) : 0; return Number.isSafeInteger(value) && value >= 0 ? value : 0;},
    markVersion(version: number) {if (!owner || !Number.isSafeInteger(version) || version < 0) throw new Error('Invalid version'); storage.setItem(`${key(owner)}:version`, String(version));},
    switchTo(id: string | null) {
      if (id !== null && (!/^[A-Za-z0-9_-]{1,200}$/.test(id) || ['__proto__', 'constructor', 'prototype'].includes(id))) throw new Error('Invalid account identity');
      if (id === owner) return;
      flush();
      const raw = id ? storage.getItem(key(id)) : null;
      const next = id ? (raw ? parseProgressData(JSON.parse(raw)) : emptyProgressData()) : local;
      applying = true;
      try {adapter.beforeSwitch?.(id); owner = id; adapter.write(parseProgressData(next));} finally {applying = false;}
    },
    importBrowser() {if (!owner) throw new Error('Sign in first'); applying = true; try {adapter.write(parseProgressData(local));} finally {applying = false;} flush();},
    replace(data: unknown) {const safe = parseProgressData(data); applying = true; try {adapter.write(safe);} finally {applying = false;} flush();},
  };
}
