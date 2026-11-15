import assert from 'node:assert/strict';
import test from 'node:test';
import {lessons} from '../src/lib/lessons';

test('authored YouTube metadata and absolute sentence clips survive Prisma seed mapping',async()=>{
 const original=lessons[0];
 lessons[0]={...original,source:'YOUTUBE',youtubeId:'M7lc1UVf-VE',sentences:original.sentences.map((s,index)=>({...s,startSec:10+index*5,endSec:12+index*5}))};
 try{
  const {seedLessons}=await import('../src/lib/server/lesson-data');
  const seeded=seedLessons[0];
  assert.equal(seeded.source,'YOUTUBE');
  assert.equal(seeded.youtubeId,'M7lc1UVf-VE');
  assert.equal(seeded.startSec,10);
  assert.equal(seeded.endSec,22);
  assert.deepEqual(seeded.sentences.map(s=>[s.startMs,s.endMs]),[[10000,12000],[15000,17000],[20000,22000]]);
  assert.equal(seeded.sentences[0].audioUrl,original.sentences[0].audio);
 }finally{lessons[0]=original;}
});
