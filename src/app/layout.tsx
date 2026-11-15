import type {Metadata} from 'next';
import {Inter,Noto_Sans_JP,JetBrains_Mono} from 'next/font/google';
import './globals.css';
const inter=Inter({subsets:['latin','vietnamese'],display:'swap',variable:'--font-inter'});
const japanese=Noto_Sans_JP({subsets:['latin'],display:'swap',variable:'--font-noto-sans-jp',preload:false});
const mono=JetBrains_Mono({subsets:['latin'],display:'swap',variable:'--font-jetbrains-mono',preload:false});
export const metadata:Metadata={title:{default:'NhaiKanji — Học tiếng Nhật mỗi ngày',template:'%s | NhaiKanji'},description:'Luyện nghe chép chính tả, shadowing và từ vựng tiếng Nhật theo trình độ JLPT N5–N1.',icons:{icon:'/icon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi" suppressHydrationWarning><body className={`${inter.variable} ${japanese.variable} ${mono.variable} font-sans`}>{children}</body></html>;}
