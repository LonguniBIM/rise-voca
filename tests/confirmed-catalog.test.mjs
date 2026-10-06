import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {loadCatalog} from '../scripts/catalog.mjs';
import {currentLessonProgress} from '../src/lesson-coverage.js';
import * as D from '../src/core.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const boundary='data/lesson-packs/2026-10-06b-zip43.json';
const {library:before,registry:oldArt}=loadCatalog(root,{throughFile:boundary});
const {library:lib,registry}=loadCatalog(root);
const lesson=id=>lib.lessons.find(l=>l.id===id);
const ids=(l,role)=>l.targets.filter(t=>!role||t.role===role).map(t=>t.itemId);
const item=id=>lib.items.find(i=>i.id===id);
test('all 43 lessons are complete after confirmed corrections, with no duplicates or pending content',()=>{
 assert.equal(lib.lessons.length,43);assert.equal(lib.sources.length,43);assert.equal(lib.topics.length,4);
 assert.equal(lib.items.length,233);assert(lib.items.every(i=>i.status==='ready'));assert.equal(lib.ambiguities.length,0);
 assert.equal(lib.archivedItems.length,8);assert.equal(registry.records.length,233);assert.equal(registry.archivedRecords.length,8);
 assert.equal(new Set(lib.lessons.map(l=>[l.classId,l.theme,l.lessonNumber,l.date].join('|'))).size,43);
 for(const l of lib.lessons){assert(D.lessonReadiness(lib,l).ready);const s=D.createSession(lib,[l.id]);assert.deepEqual(new Set(s.questions.map(q=>q.question.itemId)),new Set(ids(l)));D.validateSession(s);}
});
test('C01/C02 include the entire Unit 1 Lesson 1-10 key union plus explicitly printed Bird',()=>{
 const sources=lib.lessons.filter(l=>l.topicId==='abc'&&l.lessonNumber<=10).sort((a,b)=>a.lessonNumber-b.lessonNumber);
 assert.equal(sources.length,10);assert(sources.some(l=>l.id==='pk1-2603-t1-l5-20260523'));assert(!sources.some(l=>l.date==='2026-07-04'));
 const expected=[...new Set([...sources.flatMap(l=>ids(l,'key')),'bird'])];
 for(const n of [11,12]){const l=lesson('pk1-2603-t1-l'+n);assert.deepEqual(new Set(ids(l,'key')),new Set(expected));assert.equal(ids(l,'core').length,52);assert.equal(new Set(ids(l)).size,l.targets.length);assert.deepEqual(l.reviewDefinition.sourceLessonIds,sources.map(s=>s.id));assert.deepEqual(l.reviewDefinition.retainedExplicitItemIds,['bird']);}
 assert.equal(expected.length,39);assert.equal(lesson('pk1-2603-t1-l11').targets.length,91);
});
test('C03 confirms Pen as the last key word; C05 adds Penguin and Tree, not Tree trunk',()=>{
 assert.deepEqual(ids(lesson('pk1-2603-t3-l5'),'key'),['magic','glasses','map','magic-beans','umbrella','pen']);
 assert.deepEqual(ids(lesson('pk1-2603-t3-l8'),'key'),['giraffe','bear','rabbit','bean','peach','penguin','tree']);
});
test('C04/C06 share the confirmed soil/ground Earth sense and never substitute a globe',()=>{
 const earth=item('earth-sense-pending');assert.equal(earth.status,'ready');assert.match(earth.question.explanation,/soil or ground, not the planet/);
 for(const n of [7,9])assert(ids(lesson('pk1-2603-t3-l'+n)).includes(earth.id));
 assert.equal(registry.records.find(r=>r.itemId===earth.id).kind,'missing');
});
test('C07/C08/C09 contain all eleven core colours from Unit 3 Lessons 1-9',()=>{
 const source=lib.lessons.filter(l=>l.topicId==='colors'&&l.lessonNumber<=9);assert.equal(source.length,9);
 const expected=new Set(source.flatMap(l=>ids(l,'core')));assert.equal(expected.size,11);
 for(const n of [10,11,12]){const l=lesson('pk1-2603-t3-l'+n);assert.deepEqual(new Set(ids(l,'core')),expected);assert.deepEqual(ids(l,'key'),ids(before.lessons.find(x=>x.id===l.id),'key'));assert.equal(D.createSession(lib,[l.id]).questions.length,16);}
});
test('M01 corrects all effective July metadata while preserving stable IDs and printed provenance',()=>{
 const l=lesson('pk1-2603-t1-l5');assert.equal(l.name,'PK1_2 - Ant Disaster_5');assert.equal(l.theme,'2 - Ant Disaster');assert.equal(l.topicId,'numbers');assert.equal(l.song,'Number Song');assert.equal(l.date,'2026-07-04');
 assert.equal(l.originalSource.theme,'1 - ABC Workshop');assert.equal(lesson('pk1-2603-t1-l5-20260523').name,'PK1_1 - ABC Workshop_5');
 assert(!lib.lessons.some(l=>l.id==='pk1-2603-t2-l5'));assert.equal(lib.lessons.filter(l=>l.topicId==='numbers').length,12);assert.equal(lib.lessons.filter(l=>l.topicId==='abc').length,12);
 const s=D.createSession(lib,[l.id]);assert.deepEqual(s.lessonNames,[l.name]);assert(s.questions.every(q=>q.question.topicId==='numbers'));
 const source=lib.sources.find(s=>s.id===l.sourceId);assert.equal(source.effectiveMetadata.song,'Number Song');
});
test('M02 copies Lesson 5 speaking patterns exactly and M03 uses only cloudy/rainy wording',()=>{
 const a=lesson('pk1-2603-t3-l5'),b=lesson('pk1-2603-t3-l6');assert.deepEqual(b.sourceQuestions,a.sourceQuestions);assert.deepEqual(b.sourceAnswers,a.sourceAnswers);assert.notEqual(b.sourceQuestions,a.sourceQuestions);assert(b.originalSource.sourceQuestions.some(q=>/letter/i.test(q)));
 const w=lesson('pk1-2603-t4-l5');assert.match(w.sourceQuestions.at(-1),/cloudy\/rainy/);assert.match(w.sourceAnswers[0],/cloudy\/rainy/);assert(![...w.sourceQuestions,...w.sourceAnswers].some(q=>/sunny|windy/i.test(q)));assert(w.originalSource.sourceQuestions.some(q=>/sunny/gi.test(q)));
 for(const id of ['cloudy','rainy','umbrella','wet','dark','play','boat'])assert.deepEqual(item(id).question,before.items.find(i=>i.id===id).question);
});
test('latest split creates two independent targets and archives the superseded combined item',()=>{
 const l=lesson('pk1-2603-t4-l2');assert.equal(l.targets.length,9);assert(ids(l).includes('turning-green'));assert(ids(l).includes('bloom'));assert(!ids(l).includes('turning-green-bloom-pending'));assert(!item('turning-green-bloom-pending'));
 assert.equal(item('turning-green').word,'Turning green');assert.equal(item('bloom').word,'Bloom');assert.notEqual(item('turning-green').question.id,item('bloom').question.id);
 assert.equal(lib.archivedItems.find(x=>x.item.id==='turning-green-bloom-pending').item.word,'Turning green Bloom');assert(lib.resolutions.find(r=>r.itemId==='turning-green-bloom-pending').supersededBy);
 for(const id of ['turning-green','bloom'])assert.equal(registry.records.find(r=>r.itemId===id).status,'needs-review');
});
test('old unfinished compound/July sessions and backups remain byte-for-byte unchanged',()=>{
 const old=[D.createSession(before,['pk1-2603-t4-l2']),D.createSession(before,['pk1-2603-t1-l5'])];
 for(const s of old){D.submitAnswer(s,s.questions[0].question.correctOptionId);D.pause(s);}
 const snapshot=JSON.stringify(old);loadCatalog(root);assert.equal(JSON.stringify(old),snapshot);D.validateBackup(JSON.stringify(D.makeBackup(old,lib)));
 assert(old[0].questions.some(q=>q.question.itemId==='turning-green-bloom-pending'));assert.deepEqual(old[1].lessonNames,['PK1_1 - ABC Workshop_5']);assert(old[1].questions.every(q=>q.question.topicId==='abc'));
 const oldComplete=structuredClone(old[0]);oldComplete.status='completed';oldComplete.questions.forEach(q=>q.firstCorrect={at:oldComplete.startedAt,attempts:1});const p=currentLessonProgress([oldComplete],lesson('pk1-2603-t4-l2'));assert.equal(p.solved.length,0);assert.equal(p.earlier,1);
});
test('unaffected lesson definitions and existing illustration identities are preserved',()=>{
 const touched=new Set(lib.correctionHistory.flatMap(h=>h.lessonIds));
 for(const l of before.lessons)if(!touched.has(l.id))assert.deepEqual(lesson(l.id),l);
 const archived=new Set(lib.archivedItems.map(e=>e.item.id));
 for(const r of oldArt.records)if(!archived.has(r.itemId)&&r.itemId!=='earth-sense-pending')assert.deepEqual(registry.records.find(i=>i.itemId===r.itemId),r);
 assert.equal(lib.correctionHistory.at(-1).contentVersion,'2026.10.06.3');
 const weeks=new Set(lib.lessons.map(l=>{const d=new Date(l.date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);}));
 const summary={lessons:lib.lessons.length,fullLessons:lib.lessons.filter(l=>D.lessonReadiness(lib,l).ready).length,items:lib.items.length,weeks:weeks.size,memberships:lib.lessons.reduce((n,l)=>n+l.targets.length,0),abcReview:lesson('pk1-2603-t1-l11').targets.length,colourReview:lesson('pk1-2603-t3-l10').targets.length,weather2:lesson('pk1-2603-t4-l2').targets.length};
 assert.equal(weeks.size,22);console.log('PARENT_CONFIRMATIONS '+JSON.stringify(summary));
});
