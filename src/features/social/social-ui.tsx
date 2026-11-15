"use client";

import Link from 'next/link';
import {useLocale, useTranslations} from 'next-intl';
import {CheckCircle2, Search} from 'lucide-react';
import {useEffect, useState, type ReactNode} from 'react';
import {Avatar, Button} from '@/components/ui';
import {cn} from '@/lib/utils';
import {shopItems} from '@/lib/social-data';

export const fieldClass = 'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15';

export function Currency({amount}: {amount: number}) {
  const locale = useLocale();
  const t = useTranslations('social');
  return <span aria-label={t('balance', {amount: amount.toLocaleString(locale)})} className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-800 dark:text-amber-200"><span aria-hidden="true">🍡</span>{amount.toLocaleString(locale)}</span>;
}

export function Filters({items, value, onChange}: {items: {value: string; label: string; count?: number}[]; value: string; onChange: (value: string) => void}) {
  return <div className="flex flex-wrap gap-2">{items.map(item => <button type="button" key={item.value} aria-pressed={item.value === value} onClick={() => onChange(item.value)} className={cn('inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors', item.value === value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary')}>{item.label}{item.count !== undefined && <span className="rounded-md bg-background/20 px-1.5 text-xs">{item.count}</span>}</button>)}</div>;
}

export function RouteButton({page, children, variant = 'primary'}: {page: string; children: ReactNode; variant?: 'primary' | 'outline' | 'ghost'}) {
  const locale = useLocale();
  return <Button variant={variant} asChild><Link href={`/${locale}/${page}`}>{children}</Link></Button>;
}

export function Notice({message}: {message: string}) {
  if (!message) return null;
  return <div role="status" className="flex items-start gap-2 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-foreground"><CheckCircle2 className="mt-0.5 shrink-0 text-success" size={17}/>{message}</div>;
}

export function useNotice() {
  const [message, setMessage] = useState('');
  useEffect(() => {if (!message) return; const timer = window.setTimeout(() => setMessage(''), 6000); return () => window.clearTimeout(timer);}, [message]);
  return {message, notify: setMessage};
}

export function SearchField({value, onChange, placeholder}: {value: string; onChange: (value: string) => void; placeholder: string}) {
  return <label className="relative block w-full sm:max-w-sm"><Search size={18} className="pointer-events-none absolute left-3.5 top-3 text-muted-foreground"/><input type="search" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} className={cn(fieldClass, 'pl-10')}/></label>;
}

export function Field({label, children, hint}: {label: string; children: ReactNode; hint?: string}) {
  return <label className="grid gap-2 text-sm font-medium">{label}{children}{hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}</label>;
}

export function FramedAvatar({name, level, frame, size = 88}: {name: string; level: number; frame?: string | null; size?: number}) {
  const item = shopItems.find(item => item.id === frame && item.type === 'frame');
  return <span className="relative inline-flex items-center justify-center" style={{width: size + 24, height: size + 24}}><Avatar name={name} level={level} size={size}/>{item && <img src={item.art} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full scale-125"/>}</span>;
}
