import {notFound} from 'next/navigation';
import {LessonPlayer} from '@/features/lessons';
import {VocabularyPage,GrammarPage,ExamsPage,GamesPage} from '@/features/study';
export default async function Page({params}:{params:Promise<{page:string;id:string}>}){const {page,id}=await params;if(page==='listening'||page==='speaking')return <LessonPlayer mode={page} lessonId={id}/>;if(page==='vocabulary')return <VocabularyPage deckId={id}/>;if(page==='grammar')return <GrammarPage grammarId={id}/>;if(page==='exams')return <ExamsPage examId={id}/>;if(page==='games')return <GamesPage gameId={id}/>;notFound();}
