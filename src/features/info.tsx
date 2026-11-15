"use client";
import Link from 'next/link';
import {useLocale,useTranslations} from 'next-intl';
import {Logo,Card,Button} from '@/components/ui';
import {HeaderControls} from '@/components/app-shell';
export function InfoPage({page}:{page:string}){const t=useTranslations('info'),c=useTranslations('common'),locale=useLocale();return <div className="min-h-dvh bg-canvas"><header className="mx-auto flex h-20 max-w-5xl items-center justify-between px-6"><Link href={`/${locale}`}><Logo/></Link><HeaderControls landing/></header><main className="mx-auto max-w-3xl px-5 py-16"><Card className="p-6 sm:p-10"><h1 className="text-3xl font-bold">{t(`${page}Title`)}</h1><p className="my-7 text-base leading-8 text-muted-foreground">{t(`${page}Text`)}</p><Button asChild><Link href={`/${locale}/${page==='contact'?'feedbacks':'home'}`}>{page==='contact'?t('feedback'):c('homeLink')}</Link></Button></Card></main></div>}
