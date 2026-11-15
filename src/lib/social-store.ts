"use client";

import {useEffect} from 'react';
import {useStore} from 'zustand';
import {createStore} from 'zustand/vanilla';
import {createJSONStorage, persist, type StateStorage} from 'zustand/middleware';
import {seedPosts, topics, type Topic} from './social-data';

export type PersonalNote = {id: string; title: string; body: string; tag: string; updatedAt: string};
export type NoteInput = Omit<PersonalNote, 'id' | 'updatedAt'> & {id?: string};
export type LocalPost = {id: string; title: string; body: string; topic: Topic; author: string; createdAt: string};
export type LocalComment = {id: string; body: string; author: string; createdAt: string};
export type SavedWord = {id: string; word: string; reading: string; meaning: string; level: string};
export type Preferences = {dailyGoal: number; sound: boolean; furigana: boolean; reminders: boolean};
export interface SocialState {
  notes: PersonalNote[];
  saveNote: (note: NoteInput) => string | false;
  deleteNote: (id: string) => void;
  posts: LocalPost[];
  likedPosts: string[];
  comments: Record<string, LocalComment[]>;
  addPost: (post: Omit<LocalPost, 'id' | 'createdAt'>) => string | false;
  deletePost: (id: string) => void;
  toggleLike: (id: string) => void;
  addComment: (postId: string, body: string, author: string) => boolean;
  profile: {bio: string; isPublic: boolean; wallpaper: string | null};
  updateProfile: (profile: Partial<SocialState['profile']>) => void;
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  feedbacks: {id: string; category: string; body: string; createdAt: string}[];
  saveFeedback: (category: string, body: string) => boolean;
  words: SavedWord[];
  saveWord: (word: Omit<SavedWord, 'id'>) => boolean;
  removeWord: (id: string) => void;
}

const id = () => globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const emptyStorage: StateStorage = {getItem: () => null, setItem: () => {}, removeItem: () => {}};

export function createSocialStore(storage?: StateStorage) {
  return createStore<SocialState>()(persist((set, get) => ({
    notes: [],
    profile: {bio: '', isPublic: true, wallpaper: null},
    updateProfile: (profile) => set(state => ({profile: {...state.profile, ...profile, bio: (profile.bio ?? state.profile.bio).slice(0, 180)}})),
    preferences: {dailyGoal: 15, sound: true, furigana: true, reminders: false},
    setPreference: (key, value) => set(state => ({preferences: {...state.preferences, [key]: key === 'dailyGoal' ? Math.min(60, Math.max(5, Number(value))) : value}})),
    feedbacks: [],
    saveFeedback: (category, body) => {
      if (!body.trim() || body.trim().length > 3000 || !['idea', 'bug', 'content', 'other'].includes(category)) return false;
      set(state => ({feedbacks: [{id: id(), category, body: body.trim(), createdAt: new Date().toISOString()}, ...state.feedbacks]}));
      return true;
    },
    words: [],
    saveWord: (word) => {
      if (!word.word.trim() || !word.meaning.trim() || get().words.some(item => item.word === word.word.trim())) return false;
      set(state => ({words: [{...word, id: id(), word: word.word.trim().slice(0, 80), reading: word.reading.trim().slice(0, 80), meaning: word.meaning.trim().slice(0, 200)}, ...state.words]}));
      return true;
    },
    removeWord: (wordId) => set(state => ({words: state.words.filter(word => word.id !== wordId)})),
    posts: [], likedPosts: [], comments: {},
    addPost: (post) => {
      const title = post.title.trim();
      const body = post.body.trim();
      if (!title || !body || title.length > 140 || body.length > 3000 || !topics.includes(post.topic)) return false;
      const saved = {...post, id: id(), title, body, author: post.author.trim().slice(0, 40) || 'NhaiKanji', createdAt: new Date().toISOString()};
      set(state => ({posts: [saved, ...state.posts]}));
      return saved.id;
    },
    deletePost: (postId) => set(state => {
      const comments = {...state.comments};
      delete comments[postId];
      return {posts: state.posts.filter(post => post.id !== postId), likedPosts: state.likedPosts.filter(item => item !== postId), comments};
    }),
    toggleLike: (postId) => {
      if (!seedPosts.some(post => post.id === postId) && !get().posts.some(post => post.id === postId)) return;
      set(state => ({likedPosts: state.likedPosts.includes(postId) ? state.likedPosts.filter(item => item !== postId) : [...state.likedPosts, postId]}));
    },
    addComment: (postId, body, author) => {
      if (!body.trim() || body.trim().length > 1000 || (!seedPosts.some(post => post.id === postId) && !get().posts.some(post => post.id === postId))) return false;
      const comment = {id: id(), body: body.trim(), author: author.slice(0, 40), createdAt: new Date().toISOString()};
      set(state => ({comments: {...state.comments, [postId]: [...(state.comments[postId] ?? []), comment]}}));
      return true;
    },
    saveNote: (note) => {
      const title = note.title.trim();
      const body = note.body.trim();
      if (!title || !body || title.length > 120 || body.length > 6000) return false;
      if (note.id && !get().notes.some(item => item.id === note.id)) return false;
      const saved: PersonalNote = {id: note.id ?? id(), title, body, tag: note.tag.slice(0, 30), updatedAt: new Date().toISOString()};
      set(state => ({notes: [saved, ...state.notes.filter(item => item.id !== saved.id)]}));
      return saved.id;
    },
    deleteNote: (noteId) => set(state => ({notes: state.notes.filter(note => note.id !== noteId)})),
  }), {
    name: 'nhaikanji-social-v1',
    storage: createJSONStorage(() => storage ?? (typeof window === 'undefined' ? emptyStorage : window.localStorage)),
    skipHydration: !storage,
  }));
}

export const socialStore = createSocialStore();
export function useSocialStore() {
  useEffect(() => {void socialStore.persist.rehydrate();}, []);
  return useStore(socialStore);
}
