import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {NextIntlClientProvider} from 'next-intl';
import {AccountBoundary, AccountSettings} from '../src/features/account';
import account from '../src/messages/account.en.json';
import {readAccountData} from '../src/lib/account-stores';
import {useStudyStore} from '../src/lib/store';
function DraftProbe(){const [draft,setDraft]=useState('');return React.createElement('input',{'aria-label':'Unsaved lesson draft',value:draft,onChange:(event:React.ChangeEvent<HTMLInputElement>)=>setDraft(event.target.value)});}
let mount=0;const root=createRoot(document.getElementById('root')!);
(window as any).accountQA = {read: readAccountData, xp: (xp: number) => useStudyStore.setState({xp}),remount:()=>{mount++;render();}};
function render(){root.render(React.createElement(NextIntlClientProvider, {locale: 'en', messages: {account}, children: React.createElement(AccountBoundary, {key:mount,children: React.createElement(React.Fragment,null,React.createElement(AccountSettings),React.createElement(DraftProbe))})}));}
render();
