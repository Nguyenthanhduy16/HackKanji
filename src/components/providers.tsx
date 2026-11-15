"use client";
import {ThemeProvider} from 'next-themes';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {useState} from 'react';
import {Tooltip} from 'radix-ui';
export function Providers({children}:{children:React.ReactNode}){const [client]=useState(()=>new QueryClient({defaultOptions:{queries:{staleTime:60000,retry:1}}}));return <ThemeProvider attribute="class" defaultTheme="light" enableSystem><QueryClientProvider client={client}><Tooltip.Provider delayDuration={250}>{children}</Tooltip.Provider></QueryClientProvider></ThemeProvider>;}
