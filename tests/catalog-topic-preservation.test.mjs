import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {loadCatalog} from '../scripts/catalog.mjs';
import {createSession,validateSession} from '../src/core.js';

const root=fileURLToPath(new URL('../',import.meta.url));

test('sharing existing words with the new Toy Factory class preserves authored topics and uses the selected lesson topic',()=>{
 const {library:before}=loadCatalog(root,{throughFile:'data/lesson-packs/2026-11-01-weather-toy-factory.json'});
 const {library:after}=loadCatalog(root,{throughFile:'data/lesson-packs/2026-11-08-toy-factory.json'});
 for(const id of ['boy','girl'])assert.equal(before.items.find(item=>item.id===id).question.topicId,'colors');
 for(const item of before.items){
  assert.deepEqual(after.items.find(next=>next.id===item.id).question,item.question,'Existing question changed: '+item.id);
 }
 const session=createSession(after,['pk2-2606-t5-l4']);
 validateSession(session);
 for(const id of ['boy','girl']){
  const question=session.questions.find(row=>row.question.itemId===id).question;
  assert.equal(question.topicId,'toy-factory');
  assert.deepEqual(question.lessonIds,['pk2-2606-t5-l4']);
 }
});
