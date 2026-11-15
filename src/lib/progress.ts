import {localDate} from './utils';
import type {StudyDay} from './store';
export type ProgressPeriod='week'|'month'|'allTime';
export type ProgressMetric='xp'|'minutes'|'lessons';
export function periodBounds(period:ProgressPeriod,now=new Date()){
 const start=new Date(now);start.setHours(12,0,0,0);
 if(period==='week')start.setDate(start.getDate()-((start.getDay()+6)%7));
 if(period==='month')start.setDate(1);
 return {start:period==='allTime'?'0000-00-00':localDate(start),end:localDate(now)};
}
export function personalRankingValue(state:{xp:number;studyDays:Record<string,StudyDay>;completedLessons:string[];completedLessonDates?:Record<string,string>},period:ProgressPeriod,metric:ProgressMetric,now=new Date()){
 if(period==='allTime'&&metric==='xp')return state.xp;
 if(period==='allTime'&&metric==='lessons')return state.completedLessons.length;
 const {start,end}=periodBounds(period,now);const included=(date:string)=>date>=start&&date<=end;
 if(metric==='lessons')return state.completedLessons.filter(key=>{const date=state.completedLessonDates?.[key];return !!date&&included(date)}).length;
 return Math.round(Object.entries(state.studyDays).filter(([date])=>included(date)).reduce((sum,[,day])=>sum+(metric==='xp'?day.xp:day.minutes),0));
}
