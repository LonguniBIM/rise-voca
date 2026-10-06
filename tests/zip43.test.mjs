import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadCatalog,catalogFiles} from '../scripts/catalog.mjs';
import * as D from '../src/core.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const audit=read('data/import-audits/2026-10-06-zip43.json');
const pack=read(audit.newPack);
// Bound this historical regression to its release so future packs can be added.
// Recompose the exact prior catalogs, rather than inventing old lesson snapshots.
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'rise-zip43-baseline-'));
let before,oldRegistry,after,registry;
try{
 fs.cpSync(path.join(root,'data'),path.join(tmp,'data'),{recursive:true});
 for(const file of catalogFiles(tmp))if(file>audit.newPack)fs.rmSync(path.join(tmp,file));
 ({library:after,registry}=loadCatalog(tmp));
 fs.rmSync(path.join(tmp,audit.newPack));
 ({library:before,registry:oldRegistry}=loadCatalog(tmp));
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
const identity=l=>[l.classId,l.theme,l.lessonNumber,l.date].map(v=>String(v).trim().replace(/\s+/g,' ').toLowerCase()).join('|');
function classify(row,lib){
 const matches=lib.lessons.filter(l=>identity(l)===identity(row));
 assert(matches.length<=1,'Duplicate composite lesson identity');
 if(!matches.length)return 'add-new';
 const source=lib.sources.find(s=>s.id===matches[0].sourceId);
 if(source?.sha256&&source.sha256!==row.sha256)throw new Error('Conflicting source bytes for an existing lesson');
 assert.equal(matches[0].id,row.lessonId);
 return 'skip-existing';
}
test('ZIP43 inventory accounts for 43 unique images: 25 existing, 18 new',()=>{
 assert.equal(audit.entries.length,43);
 assert.equal(new Set(audit.entries.map(r=>r.sha256)).size,43);
 assert.equal(new Set(audit.entries.map(identity)).size,43);
 assert.equal(before.lessons.length,25);
 const counts={'skip-existing':0,'add-new':0};let hashes=0;
 for(const row of audit.entries){
  assert.match(row.sha256,/^[a-f0-9]{64}$/);
  const decision=classify(row,before);assert.equal(decision,row.decision);counts[decision]++;
  if(decision==='skip-existing'){
   const source=before.sources.find(s=>s.id===before.lessons.find(l=>l.id===row.lessonId).sourceId);
   if(source.sha256){assert.equal(source.sha256,row.sha256);hashes++;}
  }else{
   const added=pack.lessons.find(l=>l.id===row.lessonId);assert(added);assert.equal(identity(added),identity(row));assert.equal(added.source.sha256,row.sha256);
  }
 }
 assert.deepEqual(counts,{'skip-existing':25,'add-new':18});assert.equal(hashes,17);
});
test('all prior lesson/source definitions and illustration recipes remain unchanged',()=>{
 for(const old of before.lessons)assert.deepEqual(after.lessons.find(l=>l.id===old.id),old);
 for(const old of before.sources)assert.deepEqual(after.sources.find(s=>s.id===old.id),old);
 for(const old of oldRegistry.records)assert.deepEqual(registry.records.find(r=>r.id===old.id),old);
 for(const old of before.items){
  const item=after.items.find(i=>i.id===old.id);assert(item);
  for(const key of ['word','meaning','originalText','status','reason'])assert.deepEqual(item[key],old[key]);
  if(old.question)for(const key of ['id','itemId','word','question','translation','hint','explanation','options','correctOptionId','mode','visualId'])assert.deepEqual(item.question[key],old.question[key]);
  assert(old.sourceRefs.every(s=>item.sourceRefs.includes(s)));
 }
});
test('only eighteen lessons are added and date disambiguates the conflicting printed name',()=>{
 const oldIds=new Set(before.lessons.map(l=>l.id));const added=after.lessons.filter(l=>!oldIds.has(l.id));
 assert.equal(added.length,18);assert.equal(after.lessons.length,43);assert.equal(after.sources.length,43);
 assert.equal(new Set(after.lessons.map(identity)).size,43);
 assert.deepEqual(new Set(added.map(l=>l.id)),new Set(pack.lessons.map(l=>l.id)));
 const old=after.lessons.find(l=>l.id==='pk1-2603-t1-l5');const fresh=after.lessons.find(l=>l.id==='pk1-2603-t1-l5-20260523');
 assert.equal(old.date,'2026-07-04');assert.equal(fresh.date,'2026-05-23');assert.equal(old.name,fresh.name);assert.notEqual(identity(old),identity(fresh));
});
test('each new full lesson retains every word and both uppercase/lowercase forms',()=>{
 let full=0;
 for(const def of pack.lessons){
  const l=after.lessons.find(l=>l.id===def.id);
  assert.deepEqual(l.targets.map(t=>t.itemId),[...def.core,...def.key]);
  if(!D.lessonReadiness(after,l).ready)continue;
  full++;const s=D.createSession(after,[l.id]);D.validateSession(s);
  assert.deepEqual(new Set(s.questions.map(q=>q.question.itemId)),new Set([...def.core,...def.key]));
 }
 assert.equal(full,13);
 const a=D.createSession(after,['pk1-2603-t1-l10']);assert.equal(a.questions.filter(q=>q.question.mode==='letter').length,52);
 for(const id of ['pk1-2603-t1-l2','pk1-2603-t1-l3'])assert(D.createSession(after,[id]).questions.some(q=>q.question.itemId==='elephant'));
 for(const id of ['pk1-2603-t2-l11','pk1-2603-t2-l12'])assert.equal(D.createSession(after,[id]).questions.filter(q=>q.question.mode==='number').length,20);
});
test('ellipsis, clipped rows and the unresolved Earth sense are not silently completed',()=>{
 for(const id of ['pk1-2603-t1-l11','pk1-2603-t1-l12','pk1-2603-t3-l9','pk1-2603-t3-l10','pk1-2603-t3-l12']){
  assert.throws(()=>D.createSession(after,[id]),/unresolved/);assert(D.createSession(after,[id],'review').questions.length>0);
 }
 for(const id of ['pk1-2603-t1-l11','pk1-2603-t1-l12']){
  const l=after.lessons.find(l=>l.id===id);assert.equal(l.targets.filter(t=>t.role==='core').length,52);
  assert.deepEqual(l.targets.filter(t=>t.role==='key'&&!t.itemId.startsWith('source-')).map(t=>t.itemId),['apple','bird','cow','yarn','zebra']);
 }
 assert.equal(after.items.find(i=>i.id==='earth-sense-pending').status,'pending');
 assert(!after.lessons.find(l=>l.id==='pk1-2603-t3-l8').targets.some(t=>t.itemId==='penguin'));
 assert(after.lessons.find(l=>l.id==='pk1-2603-t3-l9').targets.some(t=>t.itemId==='penguin'));
});
test('rechecking the same archive after import yields 43 skips and no new lessons',()=>{
 assert(audit.entries.every(row=>classify(row,after)==='skip-existing'));
 const known=audit.entries.find(r=>r.match==='source-sha256-and-lesson-identity');
 assert.throws(()=>classify({...known,sha256:'0'.repeat(64)},before),/Conflicting source bytes/);
});
test('new items reuse old senses and keep singular/plural targets distinct',()=>{
 assert.equal(pack.words.length,24);assert.equal(after.items.length-before.items.length,44);
 for(const [id] of pack.words){assert(!before.items.some(i=>i.id===id));assert.equal(after.items.filter(i=>i.id===id).length,1);assert(after.items.find(i=>i.id===id).sourceRefs.length>0);}
 assert(after.items.some(i=>i.id==='tomato'));assert(after.items.some(i=>i.id==='tomatoes'));
 assert(after.items.some(i=>i.id==='leaf'));assert(after.items.some(i=>i.id==='leaves'));
 for(const i of after.items)if(i.question)D.validateQuestion(i.question);
 const existingIds=new Set(oldRegistry.records.map(r=>r.id));const newArt=registry.records.filter(r=>!existingIds.has(r.id));
 assert.equal(newArt.filter(r=>r.status==='needs-review').length,19);assert(newArt.every(r=>r.status!=='approved'));
});
test('release totals distinguish questions, source gaps and weekly lesson membership',()=>{
 const weeks=new Set(after.lessons.map(l=>{const date=new Date(l.date+'T00:00:00Z');date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);return date.toISOString().slice(0,10);}));
 const summary={lessons:after.lessons.length,weeks:weeks.size,topics:after.topics.length,ready:after.items.filter(i=>i.status==='ready').length,pendingSenses:after.items.filter(i=>i.status==='pending'&&i.recordType!=='source-gap').length,sourceGaps:after.items.filter(i=>i.recordType==='source-gap').length,fullLessons:after.lessons.filter(l=>D.lessonReadiness(after,l).ready).length,memberships:after.lessons.reduce((n,l)=>n+l.targets.length,0)};
 assert.deepEqual(summary,{lessons:43,weeks:22,topics:4,ready:231,pendingSenses:1,sourceGaps:7,fullLessons:34,memberships:812});
 console.log('ZIP43_IMPORT_AUDIT '+JSON.stringify(summary));
});
