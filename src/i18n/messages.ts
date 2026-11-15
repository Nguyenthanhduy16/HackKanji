import vi from '@/messages/vi.json';
import lessonsvi from '@/messages/lessons.vi.json';
import studyvi from '@/messages/study.vi.json';
import socialvi from '@/messages/social.vi.json';
import infovi from '@/messages/info.vi.json';
import accountvi from '@/messages/account.vi.json';
import en from '@/messages/en.json';
import lessonsen from '@/messages/lessons.en.json';
import studyen from '@/messages/study.en.json';
import socialen from '@/messages/social.en.json';
import infoen from '@/messages/info.en.json';
import accounten from '@/messages/account.en.json';
import ja from '@/messages/ja.json';
import lessonsja from '@/messages/lessons.ja.json';
import studyja from '@/messages/study.ja.json';
import socialja from '@/messages/social.ja.json';
import infoja from '@/messages/info.ja.json';
import accountja from '@/messages/account.ja.json';
export const locales=['vi','en','ja'] as const;
export type Locale=typeof locales[number];
const messages = {
 vi:{...vi,lessons:lessonsvi,study:studyvi,social:socialvi,info:infovi,account:accountvi},
 en:{...en,lessons:lessonsen,study:studyen,social:socialen,info:infoen,account:accounten},
 ja:{...ja,lessons:lessonsja,study:studyja,social:socialja,info:infoja,account:accountja},
};
export function getMessages(locale:string){return messages[locale as Locale]||messages.vi;}
