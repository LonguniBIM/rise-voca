import fs from 'node:fs';
import assert from 'node:assert/strict';
import {validateLibrary,lessonReadiness} from '../src/core.js';
import {loadCatalog} from './catalog.mjs';
const {library:lib,registry:images}=loadCatalog(process.cwd());
validateLibrary(lib);
assert.equal(new Set(images.records.map(r=>r.itemId)).size,images.records.length);
assert.equal(images.records.length,lib.items.length);
for(const item of lib.items){assert(images.records.some(r=>r.itemId===item.id));if(item.status==='ready')assert(lib.topics.some(t=>t.id===item.question.topicId));for(const source of item.sourceRefs)assert(lib.sources.some(s=>s.id===source));}
for(const l of lib.lessons){assert.equal(l.name,`PK1_${lib.topics.find(t=>t.id===l.topicId).name}_${l.lessonNumber}`);assert.match(l.date,/^\d{4}-\d{2}-\d{2}$/);}
for(const original of JSON.parse(fs.readFileSync('tests/fixtures/original-questions.json'))){const item=lib.items.find(i=>i.id===original.id);for(const k of ['word','question','translation','hint','explanation'])assert.equal(item.question[k],original[k],original.id+' / '+k);assert.deepEqual(item.question.options.map(o=>o.label),original.options);}
console.log('Library valid:',lib.items.length,'items;',lib.lessons.filter(l=>lessonReadiness(lib,l).ready).length,'full lessons;',lib.lessons.length,'total lessons; original seven questions preserved.');
