"use client";

import {useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Hash, Heart, MessageCircle, MoreHorizontal, PencilLine, Send, Sparkles, Trash2, Users, X} from 'lucide-react';
import {Avatar, Badge, Button, Card, EmptyState, Mascot, Modal, PageTitle, SegmentedTabs} from '@/components/ui';
import {seedPosts, topics, type Topic} from '@/lib/social-data';
import {useSocialStore} from '@/lib/social-store';
import {useStudyStore} from '@/lib/store';
import {cn} from '@/lib/utils';
import {Field, fieldClass, Notice, useNotice} from './social-ui';

type DisplayPost = {id: string; author: string; handle: string; level: number; topic: Topic; title: string; body: string; likes: number; time: string; featured: boolean; local: boolean};

function PostCard({post}: {post: DisplayPost}) {
  const t = useTranslations('social');
  const store = useSocialStore();
  const name = useStudyStore(state => state.name);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const liked = store.likedPosts.includes(post.id);
  const comments = store.comments[post.id] ?? [];
  return <Card className="overflow-hidden" data-post-id={post.id}>
    <div className="p-5"><div className="mb-4 flex items-start gap-3"><Avatar name={post.author} level={post.level} size={42}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><p className="text-sm font-semibold">{post.author}</p><span className="text-xs text-muted-foreground">@{post.handle}</span>{post.featured && <Sparkles size={14} className="text-amber-500"/>}</div><p className="mt-1 text-xs text-muted-foreground"><span className="text-primary">{t(`topic${post.topic}`)}</span><span className="mx-1.5">·</span>{post.time}{post.local && <span className="ml-2">· {t('localPost')}</span>}</p></div>{post.local && <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)} aria-label={t('deletePost')}><Trash2 size={16}/></Button>}</div><h2 className="text-lg font-semibold leading-7">{post.title}</h2><p className={cn('mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground', !expanded && 'line-clamp-2')}>{post.body}</p>{post.body.length > 150 && <button className="mt-2 text-xs font-semibold text-primary" onClick={() => setExpanded(!expanded)}>{t(expanded ? 'showLess' : 'readMore')}</button>}</div>
    <div className="flex items-center gap-4 border-t border-border/70 px-5 py-3"><button onClick={() => store.toggleLike(post.id)} aria-pressed={liked} aria-label={t('likePost')} className={cn('flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm transition-colors hover:bg-primary/5', liked ? 'text-primary' : 'text-muted-foreground')}><Heart size={19} className={liked ? 'fill-primary' : ''}/>{post.likes + Number(liked)}</button><button onClick={() => setCommentsOpen(!commentsOpen)} aria-expanded={commentsOpen} className="flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground hover:bg-muted"><MessageCircle size={18}/>{comments.length}<span className="hidden sm:inline">{t('comments')}</span></button></div>
    {commentsOpen && <div className="border-t bg-muted/20 p-5"><p className="mb-3 text-xs text-muted-foreground">{t('localCommentsNote')}</p>{comments.map(item => <div key={item.id} className="mb-3 flex gap-2"><Avatar name={item.author} size={28}/><div className="min-w-0 flex-1 rounded-xl bg-card px-3 py-2"><p className="text-xs font-semibold">{item.author}</p><p className="mt-1 break-words text-sm">{item.body}</p></div></div>)}<form className="flex gap-2" onSubmit={event => {event.preventDefault(); if (store.addComment(post.id, comment, name)) setComment('');}}><input className={fieldClass} value={comment} maxLength={1000} onChange={event => setComment(event.target.value)} placeholder={t('commentPlaceholder')} aria-label={t('commentPlaceholder')} required/><Button type="submit" size="icon" disabled={!comment.trim()} aria-label={t('addComment')}><Send size={16}/></Button></form></div>}
    <Modal open={deleteOpen} onOpenChange={setDeleteOpen} title={t('deletePost')} description={t('deletePostDescription')}><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('cancel')}</Button><Button onClick={() => store.deletePost(post.id)}>{t('delete')}</Button></div></Modal>
  </Card>;
}

export function CommunityPage() {
  const t = useTranslations('social');
  const locale = useLocale();
  const store = useSocialStore();
  const name = useStudyStore(state => state.name);
  const level = useStudyStore(state => state.level);
  const [topic, setTopic] = useState('all');
  const [filter, setFilter] = useState('all');
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [postTopic, setPostTopic] = useState<Topic>('learning');
  const {message, notify} = useNotice();
  const posts: DisplayPost[] = [...store.posts.map(post => ({...post, handle: 'you', level, likes: 0, time: new Date(post.createdAt).toLocaleDateString(locale), featured: false, local: true})), ...seedPosts.map(post => ({...post, title: t(post.titleKey), body: t(post.bodyKey), time: t('hoursAgo', {count: post.age}), local: false}))];
  const filtered = posts.filter(post => (topic === 'all' || post.topic === topic) && (filter === 'all' || (filter === 'liked' ? store.likedPosts.includes(post.id) : post.featured)));
  return <div className="page-shell"><PageTitle title={t('communityTitle')} subtitle={t('communitySubtitle')} icon={<Users size={24}/>}/><div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
    <aside className="min-w-0 space-y-4 lg:sticky lg:top-5"><Card className="p-3"><h2 className="px-3 py-3 text-sm font-semibold">{t('topics')}</h2><nav className="flex gap-1 overflow-x-auto lg:block" aria-label={t('topics')}>{['all', ...topics].map(value => <button key={value} onClick={() => setTopic(value)} aria-pressed={topic === value} className={cn('flex min-h-11 shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm transition-colors lg:w-full', topic === value ? 'bg-[var(--accent-subtle)] font-semibold text-primary' : 'text-muted-foreground hover:bg-muted')}>{value === 'all' ? <Users size={17}/> : <Hash size={17}/>}<span>{t(value === 'all' ? 'allTopics' : `topic${value}`)}</span></button>)}</nav></Card><Card className="hidden overflow-hidden border-primary/15 bg-[var(--accent-subtle)] px-5 pb-6 pt-3 text-center lg:block"><Mascot className="mx-auto"/><h3 className="text-sm font-semibold">{t('communityEncouragement')}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{t('communityGuidelines')}</p></Card></aside>
    <div className="min-w-0 space-y-4"><Notice message={message}/><Card className="p-5">{!composing ? <button className="flex w-full items-center gap-3 text-left" onClick={() => setComposing(true)}><Avatar name={name} level={level} size={42}/><span className="flex min-h-12 flex-1 items-center justify-between gap-2 rounded-xl bg-muted/60 px-4 text-sm text-muted-foreground">{t('composerPrompt')}<PencilLine size={18}/></span></button> : <form className="space-y-4" onSubmit={event => {event.preventDefault(); if (store.addPost({title, body, topic: postTopic, author: name})) {setTitle(''); setBody(''); setComposing(false); notify(t('postSaved'));}}}><div className="flex items-center justify-between"><h2 className="font-semibold">{t('createPost')}</h2><Button variant="ghost" size="icon" type="button" onClick={() => setComposing(false)} aria-label={t('cancel')}><X size={18}/></Button></div><Field label={t('postTitle')}><input className={fieldClass} maxLength={140} value={title} onChange={event => setTitle(event.target.value)} required placeholder={t('postTitlePlaceholder')}/></Field><Field label={t('postBody')}><textarea className={fieldClass} rows={4} maxLength={3000} value={body} onChange={event => setBody(event.target.value)} required placeholder={t('postBodyPlaceholder')}/></Field><div className="flex flex-wrap items-end justify-between gap-3"><Field label={t('topic')}><select className={fieldClass} value={postTopic} onChange={event => setPostTopic(event.target.value as Topic)}>{topics.map(value => <option value={value} key={value}>{t(`topic${value}`)}</option>)}</select></Field><Button disabled={!title.trim() || !body.trim()} type="submit"><Send size={16}/>{t('publishLocally')}</Button></div><p className="text-xs text-muted-foreground">{t('composerLocalNote')}</p></form>}</Card><SegmentedTabs value={filter} onChange={setFilter} items={[{value: 'all', label: t('allPosts')}, {value: 'liked', label: t('liked')}, {value: 'featured', label: t('editorsPicks')}]}/>{filtered.length ? filtered.map(post => <PostCard key={post.id} post={post}/>) : <Card><EmptyState title={t('noPosts')} description={t('noPostsDescription')}/></Card>}</div>
  </div></div>;
}
