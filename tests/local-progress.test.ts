import test from 'node:test';
import assert from 'node:assert/strict';
import {localDate} from '../src/lib/utils';
const storage=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>storage.set(key,value),removeItem:(key:string)=>storage.delete(key)}});
Object.defineProperty(globalThis,'window',{configurable:true,value:{localStorage:globalThis.localStorage}});
const {useStudyStore}=require('../src/lib/store') as typeof import('../src/lib/store');
const reset=()=>{storage.clear();useStudyStore.setState({...useStudyStore.getInitialState(),lastCheckIn:localDate(),missionDate:localDate(),completedLessons:[],completedLessonDates:{},studyDays:{},claimedMissions:[],missionsProgress:[1,0,0,0]});};

test('each lesson mode completes and earns its bonus once',()=>{
 reset();
 useStudyStore.getState().completeLesson('morning-coffee','speaking');
 useStudyStore.getState().completeLesson('morning-coffee','listening');
 assert.equal(useStudyStore.getState().xp,90);
 assert.deepEqual(useStudyStore.getState().completedLessons,['speaking:morning-coffee','listening:morning-coffee']);
 useStudyStore.getState().completeLesson('morning-coffee','speaking');
 useStudyStore.getState().completeLesson('morning-coffee','listening');
 assert.equal(useStudyStore.getState().xp,90);
});

test('local streak includes missed dates protected by freezes',()=>{
 reset();
 const last=new Date();last.setDate(last.getDate()-3);
 useStudyStore.setState({streak:5,longestStreak:5,freezeCards:2,lastCheckIn:localDate(last),checkedIn:false});
 useStudyStore.getState().checkIn();
 assert.equal(useStudyStore.getState().streak,8);
 assert.equal(useStudyStore.getState().longestStreak,8);
 assert.equal(useStudyStore.getState().freezeCards,0);
 assert.equal(Object.values(useStudyStore.getState().studyDays).filter(day=>day.usedFreeze).length,2);
});

test('earned rewards are dated so rankings can exclude previous periods',()=>{
 reset();
 useStudyStore.getState().earnXP(10);
 assert.equal(useStudyStore.getState().studyDays[localDate()]?.xp,10);
 useStudyStore.getState().completeLesson('morning-coffee','listening');
 assert.equal(useStudyStore.getState().studyDays[localDate()]?.xp,30);
 assert.equal(useStudyStore.getState().completedLessonDates['listening:morning-coffee'],localDate());
});


test('weekly and monthly ranking boundaries use dated activity without old or future records',async()=>{
 const {personalRankingValue}=await import('../src/lib/progress');
 const now=new Date(2026,10,15,12);
 const state={xp:9999,completedLessons:['listening:a','speaking:a','grammar:one','legacy'],completedLessonDates:{'listening:a':'2026-11-10','speaking:a':'2026-11-01','grammar:one':'2026-10-01'},studyDays:{'2026-10-31':{minutes:100,xp:1000,checkedIn:true},'2026-11-01':{minutes:20,xp:200,checkedIn:true},'2026-11-09':{minutes:3,xp:30,checkedIn:true},'2026-11-15':{minutes:2,xp:20,checkedIn:true},'2026-11-16':{minutes:999,xp:999,checkedIn:true}}};
 assert.equal(personalRankingValue(state,'week','xp',now),50);
 assert.equal(personalRankingValue(state,'month','xp',now),250);
 assert.equal(personalRankingValue(state,'week','minutes',now),5);
 assert.equal(personalRankingValue(state,'month','minutes',now),25);
 assert.equal(personalRankingValue(state,'week','lessons',now),1);
 assert.equal(personalRankingValue(state,'month','lessons',now),2);
 assert.equal(personalRankingValue(state,'allTime','lessons',now),4);
 assert.equal(personalRankingValue(state,'allTime','xp',now),9999);
});

test('legacy completions are preserved without falsely completing either new mode',()=>{
 reset();useStudyStore.setState({completedLessons:['morning-coffee']});
 useStudyStore.getState().completeLesson('morning-coffee','listening');
 assert.deepEqual(useStudyStore.getState().completedLessons,['morning-coffee','listening:morning-coffee']);
 assert.equal(useStudyStore.getState().completedLessons.includes('speaking:morning-coffee'),false);
});
