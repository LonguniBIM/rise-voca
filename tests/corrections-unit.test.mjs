import test from 'node:test';
import assert from 'node:assert/strict';
import {applyCatalogCorrections} from '../scripts/catalog-corrections.mjs';
import {currentLessonProgress} from '../src/lesson-coverage.js';
const provenance = {file:'data/lesson-packs/test.json',version:'fixture.2'};
function fixture() {
 const question = id => ({id:'q-'+id,itemId:id,word:id,question:'Choose the word.',hint:'Look carefully.',explanation:id,topicId:'abc',mode:'context',options:[id,'x','y','z'].map((label,n)=>({id:id+n,label})),correctOptionId:id+'0'});
 const ids=['a','b','c','compound','green','bloom'];
 const items=ids.map(id=>({id,word:id,meaning:id,originalText:id,status:'ready',question:question(id),sourceRefs:[]}));
 items.push({id:'gap',word:'Clipped list',recordType:'source-gap',status:'pending',reason:'Source clipped',question:null,sourceRefs:[]});
 const lesson=(id,number,targets)=>({id,classId:'PK1',theme:'1 - ABC',topicId:'abc',name:id,lessonNumber:number,date:'2026-05-01',sourceId:'source-'+id,targets:targets.map(itemId=>({itemId,role:'key'})),sourceQuestions:['Original question?'],sourceAnswers:['Original answer.'],sourceNotes:'Printed note',song:'Song'});
 const lessons=[lesson('l1',1,['a','b']),lesson('l2',2,['b','c']),lesson('l3',3,['a','gap'])];
 return {library:{schemaVersion:1,libraryId:'rise-voca-pk1',contentVersion:'fixture.1',items,lessons,sources:lessons.map(l=>({id:l.sourceId,filename:l.id+'.jpg'})),topics:[{id:'abc',name:'ABC'},{id:'numbers',name:'Numbers'}],ambiguities:[{itemId:'gap',text:'Gap',reason:'Clipped'}],resolutions:[]},registry:{records:items.map(i=>({id:i.id,itemId:i.id,kind:'missing',status:'missing',visual:''}))}};
}
const apply=(data,operations)=>applyCatalogCorrections(data,{schemaVersion:1,authority:'Explicit parent decision',operations},provenance);
test('authorized review unions deduplicate within a lesson while keeping source lessons untouched',()=>{
 const before=fixture(),snapshot=structuredClone(before);
 const result=apply(before,[{code:'C01',type:'review-union',lessonId:'l3',role:'key',from:1,to:2,keepExplicit:true},{code:'C01',type:'archive-items',itemIds:['gap'],reason:'Resolved'}]);
 assert.deepEqual(before,snapshot);
 assert.deepEqual(result.library.lessons[2].targets.map(t=>t.itemId),['a','b','c']);
 assert.deepEqual(result.library.lessons[0],before.library.lessons[0]);
 assert.deepEqual(result.library.lessons[2].originalSource.targets,before.library.lessons[2].targets);
 assert.equal(result.library.ambiguities.length,0);
 assert.equal(result.library.archivedItems[0].item.id,'gap');
 assert(result.library.items.find(i=>i.id==='c').sourceRefs.includes('source-l3'));
});
test('source range gaps, ambiguous lesson numbers and unready targets fail closed',()=>{
 const d=fixture();const op={code:'C01',type:'review-union',lessonId:'l3',role:'key',from:1,to:2};
 const missing=structuredClone(d);missing.library.lessons.splice(1,1);assert.throws(()=>apply(missing,[op]),/missing or ambiguous/);
 const duplicate=structuredClone(d);duplicate.library.lessons.push({...duplicate.library.lessons[0],id:'same-number'});assert.throws(()=>apply(duplicate,[op]),/missing or ambiguous/);
 const pending=structuredClone(d);pending.library.lessons[0].targets.push({itemId:'gap',role:'key'});assert.throws(()=>apply(pending,[op]),/unresolved/);
});
test('metadata corrections retain identity and original source with explicit preconditions',()=>{
 const d=fixture();const r=apply(d,[{code:'M01',type:'lesson',lessonId:'l1',expect:{date:'2026-05-01'},fields:{theme:'2 - Numbers',topicId:'numbers',name:'PK1_2 - Numbers_1',song:'Number Song'}}]);
 const l=r.library.lessons[0];assert.equal(l.id,'l1');assert.equal(l.originalSource.theme,'1 - ABC');assert.equal(l.topicId,'numbers');
 assert.equal(r.library.sources[0].effectiveMetadata.name,l.name);
 assert.throws(()=>apply(d,[{code:'M01',type:'lesson',lessonId:'l1',expect:{date:'wrong'},fields:{name:'New'}}]),/precondition/);
 assert.throws(()=>apply(d,[{code:'M01',type:'lesson',lessonId:'l1',fields:{id:'renamed'}}]),/Unsupported/);
});
test('speaking copy is exact, independent and preserves the old appendix',()=>{
 const d=fixture();d.library.lessons[0].sourceQuestions=['What colour?'];d.library.lessons[0].sourceAnswers=['Black.'];
 const r=apply(d,[{code:'M02',type:'copy-speaking',lessonId:'l3',fromLessonId:'l1'}]);
 assert.deepEqual(r.library.lessons[2].sourceQuestions,['What colour?']);
 assert.deepEqual(r.library.lessons[2].originalSource.sourceQuestions,['Original question?']);
 r.library.lessons[0].sourceQuestions.push('More?');assert.equal(r.library.lessons[2].sourceQuestions.length,1);
});
test('splitting archives the combined item but never copies learning evidence to its replacements',()=>{
 const d=fixture();d.library.lessons[0].targets=[{itemId:'compound',role:'key'}];d.library.resolutions=[{itemId:'compound',decision:'Earlier combined decision'}];
 const r=apply(d,[{code:'V01',type:'split-item',itemId:'compound',into:['green','bloom']},{code:'V01',type:'archive-items',itemIds:['compound'],reason:'Latest parent split'}]);
 assert.deepEqual(r.library.lessons[0].targets.map(t=>t.itemId),['green','bloom']);
 assert(!r.library.items.some(i=>i.id==='compound'));assert.equal(r.library.archivedItems[0].item.question.word,'compound');
 assert.deepEqual(r.library.resolutions[0].supersededBy.replacementItemIds,['green','bloom']);
 assert(!('sessions' in r.library));
});
test('failed late correction leaves input intact and cannot archive active targets',()=>{
 const d=fixture(),before=JSON.stringify(d);
 assert.throws(()=>apply(d,[{code:'X',type:'lesson',lessonId:'l1',fields:{name:'Temporary'}},{code:'X',type:'archive-items',itemIds:['a'],reason:'Invalid'}]),/referenced/);
 assert.equal(JSON.stringify(d),before);
 assert.throws(()=>apply(d,[{code:'X',type:'set-targets',lessonId:'l1',role:'key',itemIds:['a','a']}]),/Invalid/);
 assert.throws(()=>applyCatalogCorrections(d,{schemaVersion:1,authority:'',operations:[]},provenance),/authority/);
});
function completed(ids,mode='lesson',lessonId='lesson') {return {mode,lessonIds:[lessonId],status:'completed',questions:ids.map(itemId=>({question:{itemId},firstCorrect:{attempts:1}}))};}
test('old completed coverage is retained as history but cannot complete expanded or split targets',()=>{
 const old=completed(['a','compound']);const snapshot=JSON.stringify(old);
 const result=currentLessonProgress([old],{id:'lesson',targets:['a','green','bloom'].map(itemId=>({itemId}))});
 assert.equal(result.earlier,1);assert.equal(result.solved.length,0);assert.equal(JSON.stringify(old),snapshot);
});
test('current lesson completion requires exact targets, real solved evidence and the right mode',()=>{
 const l={id:'lesson',targets:[{itemId:'a'},{itemId:'b'}]};const wrong=completed(['a','b']);wrong.questions[1].firstCorrect=null;
 const result=currentLessonProgress([completed(['b','a']),wrong,completed(['a','b'],'review'),completed(['a','b'],'lesson','other'),completed(['a','a'])],l);
 assert.equal(result.current.length,2);assert.equal(result.solved.length,1);assert.equal(result.earlier,1);
});
