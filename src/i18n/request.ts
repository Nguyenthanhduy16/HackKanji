import {getRequestConfig} from 'next-intl/server';
import {getMessages} from './messages';
export default getRequestConfig(async({requestLocale})=>{const requested=await requestLocale;const locale=requested&&['vi','en','ja'].includes(requested)?requested:'vi';return {locale,timeZone:'Asia/Ho_Chi_Minh',messages:getMessages(locale)};});
