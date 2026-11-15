import {toHiragana} from 'wanakana';
import {create} from 'zustand';

type SentenceAttempt={input:string;revealed:number[];grade:DictationGrade|null;done:boolean};
const emptyAttempt=():SentenceAttempt=>({input:'',revealed:[],grade:null,done:false});
type PlayerState={
  lessonId:string; sentenceIndex:number; position:number; playing:boolean; rate:number;
  attempts:Record<number,SentenceAttempt>;
  openLesson:(id:string)=>void; setSentence:(index:number)=>void; setInput:(input:string)=>void;
  revealWord:(index:number)=>void; revealAll:(count:number)=>void; setGrade:(grade:DictationGrade)=>void;
  setPlaying:(playing:boolean)=>void; setPosition:(position:number)=>void; setRate:(rate:number)=>void;
};
export const usePlayerStore=create<PlayerState>((set)=>({
  lessonId:'',sentenceIndex:0,position:0,playing:false,rate:1,attempts:{},
  openLesson:(lessonId)=>set({lessonId,sentenceIndex:0,position:0,playing:false,attempts:{}}),
  setSentence:(sentenceIndex)=>set({sentenceIndex,position:0,playing:false}),
  setInput:(input)=>set(s=>({attempts:{...s.attempts,[s.sentenceIndex]:{...(s.attempts[s.sentenceIndex]??emptyAttempt()),input,grade:null}}})),
  revealWord:(index)=>set(s=>{const a=s.attempts[s.sentenceIndex]??emptyAttempt();return {attempts:{...s.attempts,[s.sentenceIndex]:{...a,revealed:[...new Set([...a.revealed,index])],grade:null}}};}),
  revealAll:(count)=>set(s=>({attempts:{...s.attempts,[s.sentenceIndex]:{...(s.attempts[s.sentenceIndex]??emptyAttempt()),revealed:Array.from({length:count},(_,i)=>i),grade:null}}})),
  setGrade:(grade)=>set(s=>({attempts:{...s.attempts,[s.sentenceIndex]:{...(s.attempts[s.sentenceIndex]??emptyAttempt()),grade,done:grade.correct||s.attempts[s.sentenceIndex]?.done||false}}})),
  setPlaying:(playing)=>set({playing}),setPosition:(position)=>set({position:Math.max(0,position)}),setRate:(rate)=>set({rate}),
}));

export type ShortcutInput={key:string; editing?:boolean; interactive?:boolean; isComposing?:boolean; shiftKey?:boolean; ctrlKey?:boolean; metaKey?:boolean; altKey?:boolean};
export function getPlayerShortcut(event:ShortcutInput):'toggle'|'forward'|'backward'|'next-word'|'submit'|'blur'|null {
  if(event.isComposing||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return null;
  if(event.key==='Escape')return 'blur';
  if(event.editing) return event.key==='Enter'?'submit':event.key==='Tab'?'next-word':null;
  if(event.interactive)return null;
  return ({' ':'toggle',ArrowRight:'forward',ArrowLeft:'backward',Enter:'submit'} as const)[event.key as ' '|'ArrowRight'|'ArrowLeft'|'Enter']??null;
}

export type GradingWord = {text:string; reading:string; translation?:string};
export type WordGrade = {correct:boolean; revealed:boolean};
export type DictationGrade = {correct:boolean; score:number; words:WordGrade[]; normalizedInput:string; normalizedExpected:string};

/** Normalize width, punctuation, katakana and romaji without discarding small kana. */
export function normalizeKana(value:string, words:GradingWord[] = []):string {
  let text = value.normalize('NFKC').toLowerCase();
  for (const word of [...words].sort((a,b)=>b.text.length-a.text.length)) {
    if (/[\p{Script=Han}]/u.test(word.text)) text = text.split(word.text).join(word.reading);
  }
  return toHiragana(text, {convertLongVowelMark:false}).replace(/[\p{P}\p{Z}\p{S}\s]/gu,'');
}

/** Character alignment prevents a repeated word from earning credit twice. */
export function gradeDictation(input:string, words:GradingWord[], revealed:number[]):DictationGrade {
  const actual = normalizeKana(input, words);
  const readings = words.map(word=>normalizeKana(word.reading));
  const expected = readings.join('');
  const n=expected.length, m=actual.length;
  const dp = Array.from({length:n+1},()=>new Uint16Array(m+1));
  for(let i=0;i<=n;i++) dp[i][0]=i;
  for(let j=0;j<=m;j++) dp[0][j]=j;
  for(let i=1;i<=n;i++) for(let j=1;j<=m;j++) dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(expected[i-1]===actual[j-1]?0:1));
  const owner=readings.flatMap((reading,index)=>Array(reading.length).fill(index) as number[]);
  const incorrect=new Set<number>();
  let i=n,j=m;
  while(i>0||j>0) {
    if(i>0&&j>0&&dp[i][j]===dp[i-1][j-1]+(expected[i-1]===actual[j-1]?0:1)) {
      if(expected[i-1]!==actual[j-1]) incorrect.add(owner[i-1]);
      i--;j--;
    } else if(i>0&&dp[i][j]===dp[i-1][j]+1) {incorrect.add(owner[i-1]);i--;}
    else {incorrect.add(owner[Math.min(i,n-1)]??0);j--;}
  }
  const grades=words.map((_,index)=>({correct:!incorrect.has(index)&&actual.length>0,revealed:revealed.includes(index)}));
  return {correct:actual===expected&&expected.length>0,score:words.length?Math.round(grades.filter(word=>word.correct&&!word.revealed).length/words.length*100):0,words:grades,normalizedInput:actual,normalizedExpected:expected};
}
