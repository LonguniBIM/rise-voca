/** Compose immutable base catalogs and explicitly versioned parent-supplied lesson packs. */
import fs from 'node:fs';
import path from 'node:path';
import {validateLibrary} from '../src/core.js';
const AUTH = 'App-authored learning cue; the source supplies targets, not this question.';
export function catalogFiles(root) {
  const dir = path.join(root, 'data/lesson-packs');
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /^[a-zA-Z0-9_-]+\.json$/.test(f)).sort().map(f => 'data/lesson-packs/' + f) : [];
}
function cue(id,word,meaning,clue,wrong,hint,topic='abc',mode='context') {
  return {id:'q-'+id+'-v1',itemId:id,word,question:clue,translation:'',hint,
    explanation:word+' = '+meaning+'.',options:[word,...wrong].map((label,n)=>({id:id+'-o'+(n+1),label})),
    correctOptionId:id+'-o1',topicId:topic,mode,visualId:id,authorship:AUTH};
}
function visual(id,value='',kind='emoji',status=null,reason='') {
  if (!value) kind='missing';
  return {id,itemId:id,kind,visual:value,provider:'Native Unicode + original CSS',sourceUrl:null,
    license:null,assetPath:null,sha256:null,styleVersion:'emoji-css-v1',
    status:status||(value?'needs-review':'missing'),
    reason:reason||(value?'':'No exact approved emoji/CSS illustration; use the authored verbal clue.'),
    attribution:'Device-rendered Unicode; no font files redistributed. Original CSS layout.'};
}
export function loadCatalog(root) {
  const read = file => JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  const library=read('data/library.json'),registry=read('data/illustrations.json');
  const items=new Map(library.items.map(i=>[i.id,i]));
  const add=(id,word,meaning,clue,wrong,hint,value='',topic='abc',mode='context',kind='emoji',status=null)=>{
    if(items.has(id))throw new Error('Pack duplicates existing item ID: '+id);
    const item={id,word,meaning,originalText:word,status:'ready',reason:'',sourceRefs:[],question:cue(id,word,meaning,clue,wrong,hint,topic,mode)};
    library.items.push(item);items.set(id,item);registry.records.push(visual(id,value,kind,status));return item;
  };
  for(const file of catalogFiles(root)) {
    const pack=read(file);
    if(pack.schemaVersion!==1 || !pack.contentVersion || !Array.isArray(pack.lessons))throw new Error('Unsupported lesson pack: '+file);
    for(const topic of pack.topics||[]){if(library.topics.some(t=>t.id===topic.id))throw new Error('Duplicate topic: '+topic.id);library.topics.push(topic);}
    for(const r of pack.replacements||[]){
      const item=items.get(r.id),img=registry.records.find(x=>x.itemId===r.id);
      if(!item||item.status!=='pending'||!img||!(pack.resolutions||[]).some(x=>x.itemId===r.id))throw new Error('Replacement requires an explicit pending-item resolution: '+r.id);
      Object.assign(item,{word:r.word,meaning:r.meaning,status:'ready',reason:'',question:cue(r.id,r.word,r.meaning,r.clue,r.wrong,r.hint,library.lessons.find(l=>l.targets.some(t=>t.itemId===r.id))?.topicId||'weather')});
      if(r.explanation)item.question.explanation=r.explanation;
      Object.assign(img,visual(r.id,r.visual,r.kind));
      library.ambiguities=library.ambiguities.filter(a=>a.itemId!==r.id);
    }
    library.resolutions=[...(library.resolutions||[]),...(pack.resolutions||[])];
    for(const w of pack.words||[])add(...w);
    for(const char of pack.letters||'')for(const form of ['upper','lower']){
      const id='letter-'+char+'-'+form;if(items.has(id))continue;
      const alphabet=form==='upper'?'ABCDEFGHIJKLMNOPQRSTUVWXYZ':'abcdefghijklmnopqrstuvwxyz',label=form==='upper'?char.toUpperCase():char;
      add(id,label,(form==='upper'?'ch\u1eef hoa ':'ch\u1eef th\u01b0\u1eddng ')+label,'Which letter is shown?',Array.from({length:3},(_,n)=>alphabet[(alphabet.indexOf(label)+n+1)%26]),'Look carefully at the shape of the letter.',label,'abc','letter','letter','non-pictorial');
    }
    const nums=pack.numberWords||[];
    for(const [index,word]of nums.entries()){
      const id='number-'+(index+1);if(items.has(id))continue;
      const title=w=>w[0].toUpperCase()+w.slice(1);
      add(id,title(word),'s\u1ed1 '+(index+1),'What number is shown?',Array.from({length:3},(_,n)=>title(nums[(index+n+1)%nums.length])),'Look at the numeral in the circle.',String(index+1),'numbers','number','number','non-pictorial');
    }
    const colors=pack.colors||[];
    for(const [index,[word,meaning,value]]of colors.entries()){
      const id='color-'+word;if(items.has(id))continue;
      const title=w=>w[0].toUpperCase()+w.slice(1);
      add(id,title(word),meaning,'What colour is the patch?',[1,3,5].map(n=>title(colors[(index+n)%colors.length][0])),'Look only at the solid colour inside the small square.',value,'colors','color','color','non-pictorial');
    }
    for(const p of pack.pending||[]){
      if(items.has(p.id))throw new Error('Duplicate pending item: '+p.id);
      const item={...p,meaning:'Source confirmation needed',status:'pending',sourceRefs:[],question:null};items.set(p.id,item);library.items.push(item);registry.records.push(visual(p.id,'','missing',null,p.reason));library.ambiguities.push({itemId:p.id,text:p.word,reason:p.reason});
    }
    for(const definition of pack.lessons){
      if(library.lessons.some(l=>l.id===definition.id))throw new Error('Duplicate lesson: '+definition.id);
      const {core,key,source,metadataIssue,...details}=definition,sourceId='source-'+definition.id;
      const targets=[...core.map(itemId=>({itemId,role:'core'})),...key.map(itemId=>({itemId,role:'key'}))];
      const lesson={...details,sourceId,targets,sourceCoreWords:core.map(id=>items.get(id)?.originalText),sourceKeyWords:key.map(id=>items.get(id)?.originalText)};
      library.lessons.push(lesson);library.sources.push({id:sourceId,type:'parent-supplied lesson image',date:lesson.date,class:lesson.classId,title:lesson.title,...source,pack:file,distribution:'Vocabulary transcription only. Original scans are not published.'});
      for(const {itemId}of targets){const item=items.get(itemId);if(!item)throw new Error('Unknown target '+itemId);if(!item.sourceRefs.includes(sourceId))item.sourceRefs.push(sourceId);}
      if(metadataIssue)library.ambiguities.push({lessonId:lesson.id,text:lesson.date+' theme header',reason:metadataIssue});
    }
    library.contentVersion=pack.contentVersion;registry.version=pack.contentVersion;
  }
  for(const item of library.items){
    item.topicIds=[...new Set(library.lessons.filter(l=>l.targets.some(t=>t.itemId===item.id)).map(l=>l.topicId))];
    // The snapshot later receives the selected lesson's topic; this is the authored default only.
    if(item.question&&item.sourceRefs.length===1&&item.topicIds.length)item.question.topicId=item.topicIds[0];
  }
  library.lessons.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
  validateLibrary(library);
  return {library,registry};
}
