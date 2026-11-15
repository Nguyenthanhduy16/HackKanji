'use client';
import {Fragment,createContext, useContext, useEffect, useRef, useState, type ReactNode} from 'react';
import {useTranslations} from 'next-intl';
import {Button, Card} from '@/components/ui';
import {openAccountStorage, readAccountData} from '@/lib/account-stores';
import {parseProgressData} from '@/lib/account-data';

type Store = Awaited<ReturnType<typeof openAccountStorage>>;
type Snapshot = {version: number; data: unknown; updatedAt: string};
type State = {ready: boolean; configured: boolean; userId: string | null; version: number; hasRemote: boolean; status: string; busy: boolean};
type Controls = State & {act: (action: 'save' | 'restore' | 'import' | 'keep') => Promise<void>; logout: () => Promise<void>};
const Context = createContext<Controls | null>(null);
const initial: State = {ready: false, configured: false, userId: null, version: 0, hasRemote: false, status: '', busy: false};

// Mount once around the app, inside NextIntlClientProvider. It makes no uploads.
export function AccountBoundary({children,enabled=true}: {children: ReactNode;enabled?:boolean}) {
  const t = useTranslations('account');
  const [state, set] = useState(()=>({...initial,ready:!enabled}));
  const current = useRef(state); current.current = state;
  const store = useRef<Store | null>(null);
  const generation = useRef(0);
  const requests = useRef(new Set<AbortController>());
  const checking = useRef(false);
  const cancel = () => {generation.current++; requests.current.forEach(c => c.abort()); requests.current.clear();};
  async function request(path: string, init?: RequestInit) {
    const controller = new AbortController(); requests.current.add(controller);const timeout=setTimeout(()=>controller.abort(),15000);
    try {const response = await fetch(path, {...init, cache: 'no-store', credentials: 'same-origin', signal: controller.signal}); const body = await response.json(); return {response, body};} finally {clearTimeout(timeout);requests.current.delete(controller);}
  }
  async function refresh() {
    if (checking.current) return;
    checking.current = true;
    let checkGeneration = generation.current;
    try {
      const {response, body} = await request('/api/progress');
      if (checkGeneration !== generation.current) return;
      if (response.status === 401 || response.status === 503 && body.error?.code === 'auth_not_configured') {
        cancel(); checkGeneration = generation.current; store.current?.scope.switchTo(null);
        set({...initial, ready: true, configured: response.status === 401}); return;
      }
      if (!response.ok || typeof body.userId !== 'string') throw new Error('requestFailed');
      const created = !store.current ? await openAccountStorage() : null;
      if (checkGeneration !== generation.current) {created?.dispose(); return;}
      if (created) store.current = created;
      if (!store.current) throw new Error('requestFailed');
      if (store.current.scope.owner !== body.userId) {
        cancel(); checkGeneration = generation.current; store.current.scope.switchTo(body.userId);
        store.current.onStorageFailure(() => set(s => ({...s, status: 'storageFailed'})));
        // Keep the persisted acknowledgement; observing a newer backup is not consent to overwrite it.
        set({ready: true, configured: true, userId: body.userId, version: store.current.scope.version, hasRemote: !!body.snapshot, status: 'manual', busy: false});
      } else set(s => ({...s, ready: true, hasRemote: !!body.snapshot}));
    } catch {
      // An aborted, superseded identity check must not overwrite the newer state.
      if (checkGeneration !== generation.current) return;
      // Once initialized, identity probes must preserve mounted local study work.
      // Account writes still re-check the session before saving or restoring.
      set(s => ({...s, ready: Boolean(store.current?.scope.owner) || s.ready, status: 'requestFailed', busy: false}));
    } finally {checking.current = false;}
  }
  useEffect(() => {
    if(!enabled)return;
    void refresh();
    const focus = () => {void refresh();};
    const visibility = () => {if (document.visibilityState === 'visible') focus();};
    window.addEventListener('focus', focus); document.addEventListener('visibilitychange', visibility);
    const timer = window.setInterval(() => {void refresh();}, 15_000);
    return () => {clearInterval(timer); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', visibility); cancel(); try {store.current?.dispose();store.current=null;} catch { /* storage failure is shown during use */ }};
    // One coordinator owns all stores for the full app lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function act(action: 'save' | 'restore' | 'import' | 'keep') {
    const before = current.current;
    if (!before.userId || before.busy || !store.current) return;
    if (!window.confirm(t(`${action}Confirm`))) return;
    const token = generation.current; set(s => ({...s, busy: true, status: ''}));
    try {
      // Verify identity again after confirmation; cookie changes cannot move data.
      const fresh = await request('/api/progress');
      if (token !== generation.current) return;
      if (!fresh.response.ok || fresh.body.userId !== before.userId) {await refresh(); throw new Error('accountChanged');}
      if (action === 'import') {store.current.scope.importBrowser(); set(s => ({...s, status: 'imported'})); return;}
      if (action === 'restore') {
        const remote: Snapshot | null = fresh.body.snapshot;
        if (!remote) throw new Error('noBackup');
        const data = parseProgressData(remote.data);
        store.current.scope.replace(data);
        store.current.scope.markVersion(remote.version);
        set(s => ({...s, version: remote.version, hasRemote: true, status: 'restored'})); return;
      }
      const data = readAccountData();
      const result = await request('/api/progress', {method: 'PUT', headers: {'Content-Type': 'application/json', 'X-Progress-Owner': before.userId}, body: JSON.stringify({version: action === 'keep' ? fresh.body.snapshot?.version ?? 0 : before.version, data})});
      if (token !== generation.current) return;
      if (result.response.status === 409 && result.body.error?.code === 'version_conflict') {set(s => ({...s, status: 'conflict', hasRemote: true})); return;}
      if (!result.response.ok || result.body.userId !== before.userId) throw new Error('requestFailed');
      // Read back this exact version; never announce a write on an error response.
      const verified = await request('/api/progress');
      if (token !== generation.current) return;
      if (!verified.response.ok || verified.body.userId !== before.userId || verified.body.snapshot?.version !== result.body.snapshot.version) throw new Error('requestFailed');
      store.current.scope.markVersion(result.body.snapshot.version);
      set(s => ({...s, version: result.body.snapshot.version, hasRemote: true, status: 'saved'}));
    } catch (error) {if (token === generation.current) set(s => ({...s, status: error instanceof Error && ['accountChanged', 'noBackup'].includes(error.message) ? error.message : 'requestFailed'}));}
    finally {if (token === generation.current) set(s => ({...s, busy: false}));}
  }
  async function logout() {
    cancel(); set(s => ({...s, busy: true}));
    try {
      store.current?.scope.flush();
      const csrf = await request('/api/auth/csrf');
      if (!csrf.response.ok || typeof csrf.body.csrfToken !== 'string') throw new Error();
      const result = await request('/api/auth/signout', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded', 'X-Auth-Return-Redirect': '1'}, body: new URLSearchParams({csrfToken: csrf.body.csrfToken, callbackUrl: window.location.href}).toString()});
      if (!result.response.ok) throw new Error();
      await refresh();
    } catch {set(s => ({...s, busy: false, status: 'requestFailed'}));}
  }
  if (!state.ready) return <div className="p-6" role="status">{t(state.status || 'checking')} {state.status && <Button variant="outline" onClick={() => void refresh()}>{t('retry')}</Button>}</div>;
  return <Context.Provider value={{...state, act, logout}}><Fragment key={state.userId??'anonymous'}>{children}</Fragment></Context.Provider>;
}
export function useAccountIdentity(){return useContext(Context)?.userId??null;}
export function useAccountControls(){return useContext(Context);}
export function AccountSettings() {
  const t = useTranslations('account'); const account = useContext(Context);
  if (!account || !account.configured) return null;
  return <Card className="p-5 sm:p-6" data-testid="account-settings"><h2 className="font-semibold">{t('title')}</h2><p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
    {!account.userId ? <a className="mt-4 inline-block text-primary underline" href={`/api/auth/signin?callbackUrl=${encodeURIComponent(typeof window === 'undefined' ? '/' : window.location.href)}`}>{t('connect')}</a> : <>
      <p className="mt-3 text-xs text-muted-foreground">{t('manual')}</p><div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={account.busy} onClick={() => void account.act('save')}>{t('save')}</Button>
        <Button variant="outline" disabled={account.busy || !account.hasRemote} onClick={() => void account.act('restore')}>{t('restore')}</Button>
        <Button variant="outline" disabled={account.busy} onClick={() => void account.act('import')}>{t('import')}</Button>
        <Button variant="ghost" disabled={account.busy} onClick={() => void account.logout()}>{t('logout')}</Button>
      </div>{account.status === 'conflict' && <Button className="mt-3" variant="outline" disabled={account.busy} onClick={() => void account.act('keep')}>{t('keep')}</Button>}
      <p className="mt-3 text-sm" role="status">{account.busy ? t('working') : account.status ? t(account.status) : ''}</p>
    </>}
  </Card>;
}
