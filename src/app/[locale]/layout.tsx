import {NextIntlClientProvider} from 'next-intl';
import {notFound} from 'next/navigation';
import {Providers} from '@/components/providers';
import {getMessages} from '@/i18n/messages';
import {setRequestLocale} from 'next-intl/server';
import {AccountBoundary} from '@/features/account';
import {authAvailability} from '@/lib/server/environment';
export const dynamic='force-dynamic';
export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){
 const {locale}=await params;
 if(!['vi','en','ja'].includes(locale))notFound();
 setRequestLocale(locale);
 return <NextIntlClientProvider locale={locale} messages={getMessages(locale)} timeZone="Asia/Ho_Chi_Minh"><Providers><AccountBoundary enabled={authAvailability().configured}>{children}</AccountBoundary></Providers></NextIntlClientProvider>;
}
