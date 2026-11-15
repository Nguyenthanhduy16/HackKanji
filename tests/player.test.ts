import test from 'node:test';
import assert from 'node:assert/strict';

// These assertions cover the actual scoring contract used by the player UI.
test('dictation accepts mixed kana, full-width romaji, kanji and punctuation', async () => {
  const {gradeDictation} = await import('../src/lib/player-store');
  const words = [
    {text:'私', reading:'わたし', translation:'tôi'},
    {text:'は', reading:'は', translation:'trợ từ'},
    {text:'毎朝', reading:'まいあさ', translation:'mỗi sáng'},
    {text:'コーヒー', reading:'こーひー', translation:'cà phê'},
    {text:'を', reading:'を', translation:'trợ từ'},
    {text:'飲みます', reading:'のみます', translation:'uống'},
  ];
  for (const input of ['私は毎朝コーヒーを飲みます。','ワタシ ハ マイアサ コーヒー ヲ ノミマス！','ｗａｔａｓｈｉ ｈａ ｍａｉａｓａ コーヒー ｗｏ ｎｏｍｉｍａｓｕ']) {
    const result = gradeDictation(input, words, []);
    assert.equal(result.score, 100, input);
    assert.equal(result.correct, true, input);
    assert.ok(result.words.every(word => word.correct));
  }
});

test('reveals reduce earned score and mistakes remain word-specific', async () => {
  const {gradeDictation, normalizeKana} = await import('../src/lib/player-store');
  const words = [{text:'猫',reading:'ねこ'},{text:'が',reading:'が'},{text:'います',reading:'います'}];
  assert.equal(gradeDictation('猫がいます。',words,[0]).score,67);
  assert.equal(gradeDictation('猫がいます。',words,[0,1,2]).score,0);
  assert.deepEqual(gradeDictation('いぬがいます',words,[]).words.map(word=>word.correct),[false,true,true]);
  assert.equal(gradeDictation('',words,[]).score,0);
  assert.equal(gradeDictation('猫がいます猫',words,[]).correct,false);
  assert.notEqual(normalizeKana('きて'),normalizeKana('きって'));
  assert.notEqual(normalizeKana('おばさん'),normalizeKana('おばあさん'));
});

test('player shortcuts preserve editing, modifiers and IME composition', async () => {
  const {getPlayerShortcut} = await import('../src/lib/player-store');
  assert.equal(getPlayerShortcut({key:' '}),'toggle');
  assert.equal(getPlayerShortcut({key:'ArrowRight'}),'forward');
  assert.equal(getPlayerShortcut({key:'ArrowLeft'}),'backward');
  assert.equal(getPlayerShortcut({key:'Tab',editing:true}),'next-word');
  assert.equal(getPlayerShortcut({key:'Tab'}),null);
  assert.equal(getPlayerShortcut({key:'Enter',editing:true}),'submit');
  assert.equal(getPlayerShortcut({key:'Escape',editing:true}),'blur');
  assert.equal(getPlayerShortcut({key:' ',editing:true}),null);
  assert.equal(getPlayerShortcut({key:'ArrowLeft',editing:true}),null);
  assert.equal(getPlayerShortcut({key:'Enter',isComposing:true}),null);
  assert.equal(getPlayerShortcut({key:'Enter',shiftKey:true}),null);
  assert.equal(getPlayerShortcut({key:' ',ctrlKey:true}),null);
  assert.equal(getPlayerShortcut({key:'Enter',interactive:true}),null);
});

test('ephemeral player keeps sentence attempts isolated and resets between lessons', async () => {
  const {usePlayerStore} = await import('../src/lib/player-store');
  const p=()=>usePlayerStore.getState();
  p().openLesson('first');
  p().setInput('ねこ');
  p().revealWord(0);
  p().revealWord(0);
  assert.deepEqual(p().attempts[0].revealed,[0]);
  p().setSentence(1);
  assert.equal(p().attempts[1]?.input??'','');
  p().setInput('いぬ');
  p().setSentence(0);
  assert.equal(p().attempts[0].input,'ねこ');
  p().setPlaying(true);
  p().setPosition(3);
  p().openLesson('second');
  assert.equal(p().playing,false);
  assert.equal(p().position,0);
  assert.deepEqual(p().attempts,{});
});

test('original lesson seed has thirty playable lessons across five categories and levels', async () => {
  const {lessons,categories}=await import('../src/lib/lessons');
  assert.equal(lessons.length,30);
  assert.equal(new Set(lessons.map(l=>l.id)).size,30);
  assert.equal(categories.length,5);
  assert.equal(new Set(lessons.map(l=>l.level)).size,5);
  for(const lesson of lessons) {
    assert.ok(categories.some(c=>c.id===lesson.category));
    assert.ok(lesson.sentences.length>=3);
    assert.ok(lesson.sentences.every(s=>s.words.length>0&&s.words.every(w=>w.reading&&w.translation)&&s.translation));
    assert.ok(lesson.sentences.every(s=>s.text===s.words.map(w=>w.text).join('')+'。'));
  }
});
