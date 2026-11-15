"use client";

import {useMemo, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Archive, Check, Coins, PackageOpen, ShoppingBag, Snowflake, Sparkles} from 'lucide-react';
import {Card, Modal, PageTitle, SegmentedTabs, Button, Badge} from '@/components/ui';
import {useStudyStore} from '@/lib/store';
import {shopItems, type ShopItem} from '@/lib/social-data';
import {useSocialStore} from '@/lib/social-store';
import {Currency, Filters, Notice, useNotice} from './social-ui';
import {gamification} from '@/lib/gamification/config';
import {cn} from '@/lib/utils';

function ProductArt({item}: {item: ShopItem}) {
  return <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl" style={{background: item.tint}}><div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/60 blur-2xl"/>{item.type === 'frame' && <div className="absolute flex h-20 w-20 items-center justify-center rounded-full bg-white/75"><span className="font-jp text-3xl font-medium text-stone-400" lang="ja">学</span></div>}<img src={item.art} alt="" className="relative h-40 w-40 object-contain transition-transform duration-300 group-hover:scale-110"/></div>;
}

export function ShopPage() {
  const t = useTranslations('social');
  const locale = useLocale();
  const {profile, updateProfile} = useSocialStore();
  const equippedFrame = useStudyStore(state => state.equippedFrame);
  const dango = useStudyStore(state => state.dango);
  const freezeCards = useStudyStore(state => state.freezeCards);
  const ownedItems = useStudyStore(state => state.ownedItems);
  const purchase = useStudyStore(state => state.purchase);
  const buyFreeze = useStudyStore(state => state.buyFreeze);
  const equipFrame = useStudyStore(state => state.equipFrame);
  const [tab, setTab] = useState('shop');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [freezeOpen, setFreezeOpen] = useState(false);
  const {message, notify} = useNotice();
  const visible = useMemo(() => shopItems.filter(item => (filter === 'all' || item.type === filter) && (tab === 'shop' || ownedItems.includes(item.id))), [filter, ownedItems, tab]);
  const buy = () => {if (!selected) return; if (purchase(selected.id, selected.price)) notify(t('purchaseSuccess', {item: t(`item${selected.key}`)})); else notify(t('notEnoughDango')); setSelected(null);};
  return <div className="page-shell">
    <PageTitle title={t('shopTitle')} subtitle={t('shopSubtitle')} icon={<ShoppingBag size={23}/>} actions={<Currency amount={dango}/>}/>
    <Notice message={message}/>
    <Card className="mb-6 overflow-hidden border-info/20 bg-gradient-to-r from-info/10 via-card to-primary/5 p-0"><div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex items-center gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-info/15 text-info"><Snowflake size={28}/></div><div><h2 className="font-semibold">{t('freezeTitle')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('freezeDescription')}</p><p className="mt-3 text-xs font-semibold text-muted-foreground">{freezeCards} / {gamification.maxFreeze} · <span className="text-amber-700 dark:text-amber-300">🍡 {gamification.freezePrice}</span> / {t('day')}</p></div></div><Button onClick={() => setFreezeOpen(true)} disabled={freezeCards >= gamification.maxFreeze || dango < gamification.freezePrice}><Coins size={16}/>{t('buy')}</Button></div></Card>
    <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><SegmentedTabs value={tab} onChange={setTab} items={[{value: 'shop', label: <span className="inline-flex items-center gap-2"><ShoppingBag size={15}/>{t('shopTab')}</span>}, {value: 'inventory', label: <span className="inline-flex items-center gap-2"><PackageOpen size={15}/>{t('inventoryTab')}</span>}]}/><Filters value={filter} onChange={setFilter} items={[{value: 'all', label: t('all')}, {value: 'frame', label: t('frames')}, {value: 'wallpaper', label: t('wallpapers')}]}/></div>
    {visible.length === 0 ? <Card className="p-12 text-center"><Archive className="mx-auto text-muted-foreground" size={34}/><p className="mt-3 font-semibold">{t('emptyInventory')}</p><p className="mt-1 text-sm text-muted-foreground">{t('emptyInventoryDescription')}</p></Card> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{visible.map(item => {const owned = ownedItems.includes(item.id); return <Card key={item.id} className="group p-3 transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_24px_var(--shadow-light)]"><div className="relative"><ProductArt item={item}/><Badge className={cn("absolute right-2 top-2 border uppercase", item.rarity === 'epic' ? 'border-violet-300/40 bg-violet-100 text-violet-700' : item.rarity === 'rare' ? 'border-blue-300/40 bg-blue-100 text-blue-700' : 'border-stone-300/40 bg-white/85 text-stone-600')}>{t(`rarity${item.rarity}`)}</Badge></div><div className="mt-4 flex items-start justify-between gap-2"><div><h3 className="font-semibold">{t(`item${item.key}`)}</h3><p className="mt-1 text-xs text-muted-foreground">{item.type === 'frame' ? t('avatarFrame') : t('wallpaper')}</p></div><span className="shrink-0 text-sm font-bold text-amber-700 dark:text-amber-300">🍡 {item.price.toLocaleString(locale)}</span></div>{owned ? <Button className="mt-4 w-full" variant="outline" disabled={item.type === 'frame' ? equippedFrame === item.id : profile.wallpaper === item.id} onClick={() => {if (item.type === 'frame') equipFrame(item.id); else updateProfile({wallpaper: item.id}); notify(t('equippedSuccess', {item: t(`item${item.key}`)}));}}><Check size={16}/>{t((item.type === 'frame' ? equippedFrame === item.id : profile.wallpaper === item.id) ? 'equipped' : 'equip')}</Button> : <Button className="mt-4 w-full" onClick={() => setSelected(item)} disabled={dango < item.price}>{t('buy')}</Button>}</Card>;})}</div>}
    <Modal open={Boolean(selected)} onOpenChange={open => !open && setSelected(null)} title={t('confirmPurchase')} description={selected ? t('confirmPurchaseDescription', {item: t(`item${selected.key}`), price: selected.price.toLocaleString(locale)}) : undefined}><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setSelected(null)}>{t('cancel')}</Button><Button onClick={buy}>{t('confirm')}</Button></div></Modal>
    <Modal open={freezeOpen} onOpenChange={setFreezeOpen} title={t('confirmPurchase')} description={t('confirmPurchaseDescription', {item: t('freezeTitle'), price: gamification.freezePrice.toLocaleString(locale)})}><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setFreezeOpen(false)}>{t('cancel')}</Button><Button onClick={() => {if (buyFreeze()) notify(t('freezeSuccess')); else notify(t('freezeUnavailable')); setFreezeOpen(false);}}>{t('confirm')}</Button></div></Modal>
  </div>;
}
