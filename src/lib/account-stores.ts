'use client';
import {useStudyStore} from './store';
import {useLearningStore} from './study-store';
import {socialStore} from './social-store';
import {parseProgressData, progressFields, type ProgressData} from './account-data';
import {createAccountStorage} from './account-storage';
import {usePlayerStore} from './player-store';
export function readAccountData(): ProgressData {
  const pick = (value: object, keys: object) => Object.fromEntries(Object.keys(keys).map(k => [k, (value as Record<string, unknown>)[k]]));
  return parseProgressData({study: pick(useStudyStore.getState(), progressFields.study), learning: pick(useLearningStore.getState(), progressFields.learning), social: pick(socialStore.getState(), progressFields.social)});
}
function apply(data: ProgressData) {useStudyStore.setState(data.study); useLearningStore.setState(data.learning); socialStore.setState(data.social);}
export async function openAccountStorage() {
  await Promise.all([useStudyStore.persist.rehydrate(), useLearningStore.persist.rehydrate(), socialStore.persist.rehydrate()]);
  const scope = createAccountStorage(window.localStorage, {read: readAccountData, write: apply, beforeSwitch(id) {
    usePlayerStore.setState(usePlayerStore.getInitialState());
    const suffix = id ? `:account:${id}` : '';
    useStudyStore.persist.setOptions({name: `nhaikanji-study-v1${suffix}`});
    useLearningStore.persist.setOptions({name: `nhaikanji-learning-v1${suffix}`});
    socialStore.persist.setOptions({name: `nhaikanji-social-v1${suffix}`});
  }}, readAccountData());
  let failure: (() => void) | undefined;
  const flush = () => {try {scope.flush();} catch {failure?.();}};
  const stops = [useStudyStore.subscribe(flush), useLearningStore.subscribe(flush), socialStore.subscribe(flush)];
  return {scope, onStorageFailure(fn: () => void) {failure = fn;}, dispose() {stops.forEach(stop => stop()); scope.switchTo(null);scope.flush();}};
}
