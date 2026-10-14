import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadCatalog,catalogFiles} from '../scripts/catalog.mjs';
import {currentLessonProgress} from '../src/lesson-coverage.js';
import * as D from '../src/core.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const baseline='data/lesson-packs/2026-10-06c-confirmed.json';
const release='data/lesson-packs/2026-10-14-snowy-week.json';
const pack=JSON.parse(fs.readFileSync(path.join(root,release),'utf8'));
const {library:before,registry:oldArt}=loadCatalog(root,{throughFile:baseline});
const {library:after,registry}=loadCatalog(root,{throughFile:release});
const current=loadCatalog(root).library;
const l8='pk1-2603-t4-l8',l9='pk1-2603-t4-l9';
const freshIds=['snowy','melt','snowflake','snowman','ski','snowball'];
const expected8=['snowy','warm','melt','snowflake','snowman','ski','snowball'];
const expected9=['cloudy-windy-day','rainy-windy-day','snowy','umbrella','wet','dark','play','boat','warm','melt','snowflake','snowman','ski','snowball'];
const identity=l=>[l.classId,l.theme,l.lessonNumber,l.date].join('|');
const monday=date=>{const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);};

test('Snowy week adds exactly two unique lessons with verified source identities',()=>{
 const previousIds=new Set(before.lessons.map(l=>l.id));
 assert.equal(before.lessons.length,43);assert.equal(after.lessons.length,45);assert.equal(after.sources.length,45);
 assert.deepEqual(after.lessons.filter(l=>!previousIds.has(l.id)).map(l=>l.id),[l8,l9]);
 assert.equal(new Set(after.lessons.map(identity)).size,45);
 const hashes=['f44918fdb0131f6ad88d28319f8b06a9e75d1340b4d7e7d4ee6e766252eae22d','8c24b954f7f4c84683b4d518dc0488cc92f7cd5bd0b671594e533ce32cd5ef7c'];
 for(const [n,definition] of pack.lessons.entries()){
  assert(!before.lessons.some(l=>identity(l)===identity(definition)));
  const l=after.lessons.find(l=>l.id===definition.id),s=after.sources.find(s=>s.id===l.sourceId);
  assert.equal(l.classId,'PK1_2603');assert.equal(l.name,'PK1_4 - Weather Report_'+(8+n));assert.equal(l.song,'Weather Song');
  assert.equal(l.date,n===0?'2026-10-10':'2026-10-11');assert.equal(s.sha256,hashes[n]);assert.equal(s.filename,definition.source.filename);
  assert(!before.sources.some(old=>old.sha256===s.sha256));
 }
 assert.notEqual(hashes[0],hashes[1]);
});

test('each new full lesson contains every printed core/key target in source order',()=>{
 for(const [id,expected,coreCount] of [[l8,expected8,1],[l9,expected9,3]]){
  const l=after.lessons.find(l=>l.id===id);assert(D.lessonReadiness(after,l).ready);
  assert.deepEqual(l.targets.map(t=>t.itemId),expected);
  assert.deepEqual(l.targets.map(t=>t.role),expected.map((_,i)=>i<coreCount?'core':'key'));
  const session=D.createSession(after,[id]);D.validateSession(session);
  assert.deepEqual(session.questions.map(q=>q.question.itemId),expected);
  assert(session.questions.every(q=>q.question.options.length===4));
 }
 assert.equal(D.createSession(after,[l8]).questions.length,7);assert.equal(D.createSession(after,[l9]).questions.length,14);
});

test('six new items are shared without conflating Snowy with the existing Snow noun',()=>{
 const previousIds=new Set(before.items.map(i=>i.id));
 assert.deepEqual(after.items.filter(i=>!previousIds.has(i.id)).map(i=>i.id),freshIds);
 for(const id of freshIds){const i=after.items.find(i=>i.id===id);assert.equal(i.status,'ready');D.validateQuestion(i.question);assert.deepEqual(new Set(i.sourceRefs),new Set(['source-'+l8,'source-'+l9]));assert.equal(i.question.topicId,'weather');}
 assert.equal(after.items.find(i=>i.id==='snow').word,'Snow');assert.equal(after.items.find(i=>i.id==='snowy').word,'Snowy');
 assert(!expected8.includes('snow'));assert(!expected9.includes('snow'));
 assert.equal(after.items.filter(i=>i.id==='warm').length,1);
});

test('all old lessons, sources, semantic content, corrections and illustration recipes are preserved',()=>{
 for(const l of before.lessons)assert.deepEqual(after.lessons.find(x=>x.id===l.id),l);
 for(const s of before.sources)assert.deepEqual(after.sources.find(x=>x.id===s.id),s);
 for(const i of before.items){const next=after.items.find(x=>x.id===i.id);assert(i.sourceRefs.every(ref=>next.sourceRefs.includes(ref)));const oldCopy=structuredClone(i),newCopy=structuredClone(next);delete oldCopy.sourceRefs;delete newCopy.sourceRefs;assert.deepEqual(newCopy,oldCopy);}
 for(const r of oldArt.records)assert.deepEqual(registry.records.find(x=>x.itemId===r.itemId),r);
 assert.deepEqual(after.archivedItems,before.archivedItems);assert.deepEqual(registry.archivedRecords,oldArt.archivedRecords);
 assert.deepEqual(after.correctionHistory,before.correctionHistory);assert.deepEqual(after.ambiguities,before.ambiguities);
});

test('completing Lesson 8 never awards answers or completion to Lesson 9',()=>{
 const at='2026-10-14T10:00:00.000Z';
 const a=D.createSession(after,[l8],'lesson','all',null,()=>0.4,at);
 while(a.status==='in-progress'){
  if(a.phase==='break'){D.continueRound(a,at);continue;}
  const q=D.activeQuestion(a);D.submitAnswer(a,q.question.correctOptionId,D.uid(),at);D.advance(a,at);
 }
 D.validateSession(a);assert.equal(D.metrics(a).solved,7);
 assert.equal(currentLessonProgress([a],after.lessons.find(l=>l.id===l9)).solved.length,0);
 const b=D.createSession(after,[l9],'lesson','all',null,()=>0.4,at);
 assert(b.questions.every(q=>q.firstCorrect===null&&q.attempts.length===0));
 for(const id of expected8){const q=b.questions.find(q=>q.question.itemId===id);assert(q);assert.equal(q.seenAt,null);}
 assert.equal(D.questionPool(after,[l8,l9],'review').length,14);
});

test('source sunny/windy speaking patterns remain unscored and visibly annotated',()=>{
 const questions=['What is the weather like today?','What season is it?','What season do you like?','How do you feel on sunny/ windy days?'];
 for(const id of [l8,l9]){
  const l=after.lessons.find(l=>l.id===id);assert.deepEqual(l.sourceQuestions,questions);
  assert.match(l.sourceAnswers[0],/sunny\/\s?windy/);assert.match(l.sourceAnswers.at(-1),/sunny\/ windy/);
  assert.match(l.sourceNotes,/sunny\/windy/);assert.match(l.sourceNotes,/unscored reference/);
  assert.equal(l.sourceWarnings[0].blocksVocabulary,false);assert.equal(l.sourceWarnings[0].scope,'unscored-speaking-reference');
 }
 const old=after.lessons.find(l=>l.id==='pk1-2603-t4-l5');assert.match(old.sourceAnswers[0],/cloudy\/rainy/);
 assert.equal(after.items.find(i=>i.id==='snowy').question.question,'Snow is falling from the clouds. What is the weather?');
 assert.match(after.items.find(i=>i.id==='ski').question.authorship,/App-authored/);
});

test('five emoji candidates require review and Snowball remains an answerable missing-image cue',()=>{
 const added=registry.records.filter(r=>freshIds.includes(r.itemId));assert.equal(added.length,6);
 assert.equal(added.filter(r=>r.status==='needs-review').length,5);assert(added.every(r=>r.status!=='approved'&&!r.assetPath&&!r.sourceUrl));
 const ball=added.find(r=>r.itemId==='snowball');assert.equal(ball.kind,'missing');assert.equal(ball.status,'missing');
 for(const id of freshIds){const i=after.items.find(i=>i.id===id);assert.equal(i.question.mode,'context');assert(i.question.question&&i.question.hint);D.validateQuestion(i.question);}
});

test('old in-progress sessions and backups are unchanged by the added content',()=>{
 const s=D.createSession(before,['pk1-2603-t4-l5'],'lesson','all',null,()=>0.4,'2026-10-14T09:00:00.000Z');
 const q=D.activeQuestion(s);D.submitAnswer(s,q.question.correctOptionId,'old-answer','2026-10-14T09:00:01.000Z');D.pause(s,'2026-10-14T09:00:02.000Z');
 const snapshot=JSON.stringify(s);loadCatalog(root);assert.equal(JSON.stringify(s),snapshot);
 const restored=D.validateBackup(JSON.stringify(D.makeBackup([s],after)));assert.deepEqual(restored.sessions,[s]);
});

test('repeat imports fail closed instead of duplicating the same lesson records',()=>{
 for(const definition of pack.lessons)assert.equal(after.lessons.filter(l=>identity(l)===identity(definition)).length,1);
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'rise-snowy-duplicate-'));
 try{
  fs.cpSync(path.join(root,'data'),path.join(tmp,'data'),{recursive:true});
  for(const file of catalogFiles(tmp))if(file>release)fs.rmSync(path.join(tmp,file));
  fs.writeFileSync(path.join(tmp,'data/lesson-packs/zz-repeat-snowy.json'),JSON.stringify({schemaVersion:1,contentVersion:'duplicate-fixture',lessons:pack.lessons}));
  assert.throws(()=>loadCatalog(tmp),/Duplicate lesson/);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});

test('the new week is 5-11 October and every current lesson retains complete coverage',()=>{
 const weeks=new Set(after.lessons.map(l=>monday(l.date)));assert.equal(weeks.size,23);
 assert.deepEqual(after.lessons.filter(l=>monday(l.date)==='2026-10-05').map(l=>l.id),[l8,l9]);
 assert.equal([...weeks].sort().at(-1),'2026-10-05');
 assert.equal(after.items.length,239);assert.equal(after.lessons.filter(l=>D.lessonReadiness(after,l).ready).length,45);
 assert.equal(after.lessons.filter(l=>l.topicId==='weather').length,9);assert.equal(after.archivedItems.length,8);
 assert.equal(after.lessons.reduce((n,l)=>n+l.targets.length,0),912);assert(after.items.every(i=>i.status==='ready'));
 for(const l of current.lessons){assert(D.lessonReadiness(current,l).ready);const s=D.createSession(current,[l.id]);D.validateSession(s);assert.deepEqual(new Set(s.questions.map(q=>q.question.itemId)),new Set(l.targets.map(t=>t.itemId)));}
 console.log('SNOWY_WEEK '+JSON.stringify({lessons:after.lessons.length,fullLessons:45,items:after.items.length,weeks:weeks.size,memberships:912,lesson8:7,lesson9:14,sourceWarnings:2,newEmojiCandidates:5}));
});
