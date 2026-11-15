import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {loadCatalog} from '../scripts/catalog.mjs';
import {currentLessonProgress} from '../src/lesson-coverage.js';
import * as D from '../src/core.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const baseline='data/lesson-packs/2026-10-14-snowy-week.json';
const release='data/lesson-packs/2026-11-01-weather-toy-factory.json';
// Expected targets transcribed from the five supplied lesson sheets.
const weatherCore=['hot','warm','cool','cold','spring','summer','autumn','winter','sunny','windy','cloudy','rainy','snowy'];
const weatherKey=['house','tree','fly','sprout','turning-green','bloom','leaves','falling-down'];
const expected=[
 ['pk1-2603-t4-l10','PK1_2603','2026-10-17','I Feel',weatherCore,weatherKey],
 ['pk1-2603-t4-l11','PK1_2603','2026-10-18','I Am the Weather Reporter',weatherCore,[...weatherKey,'umbrella','wet']],
 ['pk1-2603-t4-l12','PK1_2603','2026-10-24','Exploration: I Feel - I Am the Weather Reporter',weatherCore,[...weatherKey,'umbrella','wet']],
 ['pk2-2603-t5-l1','PK2_2603','2026-10-31','Head, Shoulders and Neck',['head','shoulders','neck'],['robot','toy-factory','dog','bird','jump','cat']],
 ['pk2-2603-t5-l2','PK2_2603','2026-11-01','Arms, Hands and Fingers',['arms','hands','fingers'],['robot','toy-factory','magnifier','walk','pond','frog','stretch','clap','wiggle','touch']]
];

test('the publishing validator accepts the source class PK2 and rejects a mislabeled class',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'rise-class-validation-'));
 try {
  fs.cpSync(path.join(root,'data'),path.join(tmp,'data'),{recursive:true});
  fs.cpSync(path.join(root,'assets'),path.join(tmp,'assets'),{recursive:true});
  fs.cpSync(path.join(root,'tests/fixtures'),path.join(tmp,'tests/fixtures'),{recursive:true});
  const lesson={id:'pk2-class-fixture',classId:'PK2_2603',displayClass:'PK2',topicId:'class-fixture',theme:'5 - Toy Factory',lessonNumber:1,name:'PK2_5 - Toy Factory_1',date:'2026-10-31',title:'Class validation fixture',core:['dog'],key:['bird'],sourceQuestions:[],sourceAnswers:[],source:{filename:'synthetic-class-fixture'}};
  const fixture={schemaVersion:1,contentVersion:'class-fixture',topics:[{id:'class-fixture',name:'5 - Toy Factory'}],lessons:[lesson]};
  const write=()=>fs.writeFileSync(path.join(tmp,'data/lesson-packs/zz-class-fixture.json'),JSON.stringify(fixture));
  const validate=()=>spawnSync(process.execPath,[path.join(root,'scripts/validate.mjs')],{cwd:tmp,encoding:'utf8'});
  write();let result=validate();assert.equal(result.status,0,result.stderr);
  lesson.name='PK1_5 - Toy Factory_1';write();result=validate();assert.notEqual(result.status,0,'A PK2 source must not be published as PK1.');
  lesson.name='PK2_5 - Toy Factory_1';lesson.displayClass='PK1';write();result=validate();assert.notEqual(result.status,0,'The display class must match the source class.');
 } finally { fs.rmSync(tmp,{recursive:true,force:true}); }
});

test('all five supplied sheets launch full lessons with every core/key target and the correct class',()=>{
 const {library}=loadCatalog(root,{throughFile:release});
 for(const [id,classId,date,title,core,key] of expected){
  const lesson=library.lessons.find(l=>l.id===id);assert(lesson,'Missing supplied lesson: '+id);
  assert.equal(lesson.classId,classId);assert.equal(lesson.displayClass,classId.split('_')[0]);
  assert.equal(lesson.date,date);assert.equal(lesson.title,title);
  assert.equal(lesson.name,`${lesson.displayClass}_${lesson.theme}_${lesson.lessonNumber}`);
  assert.equal(lesson.song,lesson.topicId==='weather'?'Weather Song':'Hokey Pokey');
  assert.deepEqual(lesson.targets,[...core.map(itemId=>({itemId,role:'core'})),...key.map(itemId=>({itemId,role:'key'}))]);
  assert(D.lessonReadiness(library,lesson).ready);
  const session=D.createSession(library,[id]);D.validateSession(session);
  assert.deepEqual(session.lessonNames,[lesson.name]);
  assert.deepEqual(session.questions.map(q=>q.question.itemId),[...core,...key]);
  assert(session.questions.every(q=>q.question.options.length===4&&q.question.topicId===lesson.topicId));
 }
});

test('the addition preserves prior lessons, word meanings, illustrations and backup compatibility',()=>{
 const {library:before,registry:oldArt}=loadCatalog(root,{throughFile:baseline});
 const {library:after,registry}=loadCatalog(root,{throughFile:release});
 assert.equal(after.libraryId,before.libraryId);
 for(const lesson of before.lessons)assert.deepEqual(after.lessons.find(l=>l.id===lesson.id),lesson);
 for(const source of before.sources)assert.deepEqual(after.sources.find(s=>s.id===source.id),source);
 for(const item of before.items){
  const next=after.items.find(i=>i.id===item.id);
  assert(item.sourceRefs.every(ref=>next.sourceRefs.includes(ref)));
  assert(item.topicIds.every(topic=>next.topicIds.includes(topic)));
  const semantic=i=>{const {sourceRefs,topicIds,...fields}=i;return fields;};
  assert.deepEqual(semantic(next),semantic(item));
 }
 for(const record of oldArt.records)assert.deepEqual(registry.records.find(r=>r.itemId===record.itemId),record);
 assert.deepEqual(after.archivedItems,before.archivedItems);
 assert.deepEqual(after.correctionHistory,before.correctionHistory);
 const oldSession=D.createSession(before,['pk1-2603-t4-l5']);
 D.submitAnswer(oldSession,D.activeQuestion(oldSession).question.correctOptionId);D.pause(oldSession);
 const snapshot=JSON.stringify(oldSession);
 const restored=D.validateBackup(JSON.stringify(D.makeBackup([oldSession],after)));
 assert.equal(JSON.stringify(oldSession),snapshot);assert.deepEqual(restored.sessions,[oldSession]);
});

test('repeated words do not transfer completion between the new lessons or classes',()=>{
 const {library}=loadCatalog(root,{throughFile:release});
 const solve=id=>{
  const session=D.createSession(library,[id]);
  while(session.status==='in-progress'){
   if(session.phase==='break'){D.continueRound(session);continue;}
   D.submitAnswer(session,D.activeQuestion(session).question.correctOptionId);D.advance(session);
  }
  D.validateSession(session);return session;
 };
 const oldDogLesson=library.lessons.find(l=>l.classId==='PK1_2603'&&l.targets.some(t=>t.itemId==='dog'));
 for(const [from,to] of [['pk1-2603-t4-l11','pk1-2603-t4-l12'],['pk2-2603-t5-l1','pk2-2603-t5-l2'],[oldDogLesson.id,'pk2-2603-t5-l1']]){
  const completed=solve(from),target=library.lessons.find(l=>l.id===to);
  assert.equal(currentLessonProgress([completed],target).solved.length,0);
  const fresh=D.createSession(library,[to]);
  assert(fresh.questions.every(q=>q.firstCorrect===null&&q.attempts.length===0));
 }
 const dog=D.questionPool(library,[oldDogLesson.id,'pk2-2603-t5-l1'],'review').filter(q=>q.itemId==='dog');
 assert.equal(dog.length,1);assert(dog[0].topicIds.includes(oldDogLesson.topicId));assert(dog[0].topicIds.includes('toy-factory'));
});

test('the five source sheets retain distinct provenance and their own speaking patterns',()=>{
 const {library}=loadCatalog(root,{throughFile:release});
 const hashes=[
  '091cd5dbfb0b85fb4a8cd7b091330dda7900f88412b5b1c3e894be73f569c918',
  'cd2c36f625a006d16f1027bf430ab21fb591afebd740b620f92cca37cf71792e',
  'd2bcd5ef27f60e0cf6d5c9b11d03c8360c315067676f040108f608ff9bb7b4f1',
  '7701a9a646af956abda03e27e735e9b6de1ae949ae4d110486cc0d23853468b5',
  'f23fbbb7adf9f1b63ca643142c614caa5f38d3757194ee3dbcb75d81f35e58fc'
 ];
 for(const [index,[id]] of expected.entries()){
  const lesson=library.lessons.find(l=>l.id===id),source=library.sources.find(s=>s.id===lesson.sourceId);
  assert.equal(source.sha256,hashes[index]);assert.equal(source.pack,release);
  assert.equal(source.class,lesson.classId);assert.equal(source.date,lesson.date);
  assert.equal(lesson.sourceQuestions.length,[2,2,4,6,5][index]);
 }
 const toy1=library.lessons.find(l=>l.id==='pk2-2603-t5-l1');
 const toy2=library.lessons.find(l=>l.id==='pk2-2603-t5-l2');
 assert(toy1.sourceAnswers.includes('They are my shoulders.'));
 assert(toy2.sourceQuestions.includes('Clap the hands'));
 assert.equal(toy1.sourceWarnings[0].blocksVocabulary,false);
 assert(!toy1.targets.some(t=>['nod','shrug','touch'].includes(t.itemId)));
});

test('the release adds one topic and 18 distinct words across three new weekly packs',()=>{
 const {library:before}=loadCatalog(root,{throughFile:baseline});
 const {library:after,registry}=loadCatalog(root,{throughFile:release});
 const added=after.items.filter(i=>!before.items.some(old=>old.id===i.id));
 assert.deepEqual(new Set(added.map(i=>i.id)),new Set(['head','shoulders','neck','robot','toy-factory','jump','cat','arms','hands','fingers','magnifier','walk','pond','frog','stretch','clap','wiggle','touch']));
 assert(added.every(i=>i.question.topicId==='toy-factory'&&i.status==='ready'));
 assert.equal(after.items.length,257);assert.equal(after.lessons.length,50);assert.equal(after.topics.length,5);
 assert.equal(after.lessons.reduce((n,l)=>n+l.targets.length,0),1001);assert.equal(after.archivedItems.length,8);
 const monday=date=>{const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);};
 const oldWeeks=new Set(before.lessons.map(l=>monday(l.date))),weeks=new Set(after.lessons.map(l=>monday(l.date)));
 assert.equal(weeks.size,26);assert.deepEqual([...weeks].filter(w=>!oldWeeks.has(w)).sort(),['2026-10-12','2026-10-19','2026-10-26']);
 const newArt=registry.records.filter(r=>added.some(i=>i.id===r.itemId));
 assert.equal(newArt.filter(r=>r.status==='needs-review').length,8);
 assert.equal(newArt.filter(r=>r.kind==='missing').length,10);
 assert(newArt.every(r=>r.status!=='approved'&&!r.sourceUrl&&!r.assetPath));
});
