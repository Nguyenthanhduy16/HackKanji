import {notFound} from 'next/navigation';
import {Catalogue} from '@/features/lessons';
import {VocabularyPage,GrammarPage,ReviewPage,ExamsPage,GamesPage} from '@/features/study';
import {SocialPage} from '@/features/social';
export default async function Page({params}:{params:Promise<{page:string}>}){const {page}=await params;if(page==='practice'||page==='listening'||page==='speaking')return <Catalogue mode={page}/>;if(page==='vocabulary')return <VocabularyPage/>;if(page==='grammar')return <GrammarPage/>;if(page==='review')return <ReviewPage/>;if(page==='exams')return <ExamsPage/>;if(page==='games')return <GamesPage/>;if(['shop','leaderboard','community','profile','missions','my-notes','my-vocabulary','feedbacks','settings'].includes(page))return <SocialPage page={page}/>;notFound();}
