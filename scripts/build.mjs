/** Dependency-free deterministic static build. Canonical JSON is the only editable catalog. */
import fs from 'node:fs';
import {loadCatalog,catalogFiles} from './catalog.mjs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {APP_VERSION,canonical,validateLibrary,lessonReadiness} from '../src/core.js';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),out=path.join(root,'dist');
const read=p=>fs.readFileSync(path.join(root,p)),json=p=>JSON.parse(read(p)),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const {library:lib,registry}=loadCatalog(root);validateLibrary(lib);
const sourceFiles=['index.html','src/app.js','src/core.js','src/store.js','src/speech.js','src/styles.css','public/sw.js','data/library.json','data/illustrations.json','scripts/build.mjs','scripts/catalog.mjs','src/auto-read.js','src/lesson-stimuli.css',...catalogFiles(root)];
const version=APP_VERSION+'-'+hash(sourceFiles.map(f=>f+'\0'+hash(read(f))).join('\n')).slice(0,12);
lib.fingerprint=hash(canonical(lib));
for(const r of registry.records)r.identity=hash(canonical({itemId:r.itemId,kind:r.kind,visual:r.visual,sparkOne:r.sparkOne||'',sparkTwo:r.sparkTwo||'',styleVersion:r.styleVersion}));
registry.fingerprint=hash(canonical(registry));
const files=new Map(),put=(p,v)=>files.set(p,Buffer.isBuffer(v)?v:Buffer.from(typeof v==='string'?v:JSON.stringify(v,null,2)+'\n'));
for(const f of sourceFiles.filter(f=>f==='index.html'||f.startsWith('src/')))put(f,read(f));
put('data/library.json',lib);put('data/illustrations.json',registry);put('.nojekyll','');
const grouped=new Map();
for(const l of lib.lessons){const date=new Date(l.date+'T00:00:00Z'),day=(date.getUTCDay()+6)%7;date.setUTCDate(date.getUTCDate()-day);const start=date.toISOString().slice(0,10);date.setUTCDate(date.getUTCDate()+6);const end=date.toISOString().slice(0,10),id='week-'+start;if(!grouped.has(id))grouped.set(id,{id,start,end,label:start+' to '+end,lessonIds:[]});grouped.get(id).lessonIds.push(l.id);}
const weeks=[...grouped.values()].sort((a,b)=>a.start.localeCompare(b.start));put('data/weeks/index.json',weeks);
for(const w of weeks){const lessons=lib.lessons.filter(l=>w.lessonIds.includes(l.id)),ids=new Set(lessons.flatMap(l=>l.targets.map(t=>t.itemId))),items=lib.items.filter(i=>ids.has(i.id));put('data/weeks/'+w.id+'.json',{schemaVersion:1,libraryId:lib.libraryId,libraryFingerprint:lib.fingerprint,contentVersion:lib.contentVersion,week:w,lessons,items,illustrations:registry.records.filter(r=>ids.has(r.itemId))});}
// Original geometric icon rendered without fonts or externally licensed imagery.
function crc32(b){let n=0xffffffff;for(const x of b){n^=x;for(let k=0;k<8;k++)n=(n>>>1)^((n&1)?0xedb88320:0);}return(n^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),len=Buffer.alloc(4),crc=Buffer.alloc(4);len.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([len,t,data,crc]);}
function icon(size){const raw=Buffer.alloc((size*4+1)*size);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const u=x/size,v=y/size,i=y*(size*4+1)+1+x*4;let c=[91,102,232,255];const inDisc=(u-.5)**2+(v-.5)**2<.30**2;if(inDisc)c=[255,216,77,255];const left=u>.36&&u<.42&&v>.32&&v<.68,top=u>.4&&u<.59&&v>.32&&v<.39,mid=u>.4&&u<.58&&v>.47&&v<.54,right=u>.55&&u<.61&&v>.35&&v<.51,leg=v>.50&&v<.68&&Math.abs(u-(.46+(v-.5)*.85))<.037;if(left||top||mid||right||leg)c=[36,48,94,255];raw.set(c,i);}const header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);}
for(const [name,size]of [['icon-192.png',192],['icon-512.png',512],['apple-touch-icon.png',180]])put('icons/'+name,icon(size));
put('manifest.webmanifest',{id:'./',name:'Rise_Voca - Little lessons',short_name:'Rise_Voca',description:'Weekly English vocabulary practice for age five.',lang:'en',start_url:'./',scope:'./',display:'standalone',background_color:'#f4f4ff',theme_color:'#5b66e8',icons:[{src:'./icons/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'./icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]});
const coverage={items:lib.items.length,sourceGapRecords:lib.items.filter(i=>i.recordType==='source-gap').length,ready:lib.items.filter(i=>i.status==='ready').length,pending:lib.items.filter(i=>i.status==='pending').length,distinctAnswerSpellings:new Set(lib.items.filter(i=>i.status==='ready').map(i=>i.word.toLowerCase())).size,lessonMemberships:lib.lessons.reduce((n,l)=>n+l.targets.length,0),lessons:lib.lessons.length,fullLessons:lib.lessons.filter(l=>lessonReadiness(lib,l).ready).length,weeks:weeks.length,topics:lib.topics.length,retainedMappings:registry.records.filter(r=>r.status==='retained-reference').length,newCandidates:registry.records.filter(r=>r.status==='needs-review').length,nonPictorial:registry.records.filter(r=>r.status==='non-pictorial').length,missingMappings:registry.records.filter(r=>r.kind==='missing').map(r=>r.itemId),externalImageFiles:0};
put('data/coverage.json',coverage);
put('BUILD_INFO.json',{appVersion:APP_VERSION,version,contentVersion:lib.contentVersion,libraryFingerprint:lib.fingerprint,illustrationFingerprint:registry.fingerprint,coverage,fingerprintScopes:{library:'canonical content excluding generated fingerprint',illustrations:'catalog including exact item/Unicode/CSS recipe identity; no OS font bytes',app:'source paths and SHA-256; reproducible with no timestamp'}});
// Deployment markers are not runtime assets: static hosts may omit dotfiles.
const declared=[...files.entries()].filter(([p])=>p!=='.nojekyll').map(([p,b])=>({path:p,sha256:hash(b)})).sort((a,b)=>a.path.localeCompare(b.path));
put('sw.js',read('public/sw.js').toString().replace('__VERSION__',JSON.stringify(version)).replace('__FILES__',JSON.stringify(declared)));
put('offline-manifest.json',{version,files:declared});
if(process.argv.includes('--check')){for(const[p,b]of files)if(!fs.existsSync(path.join(out,p))||!fs.readFileSync(path.join(out,p)).equals(b))throw new Error('Build drift: '+p);console.log('Deterministic build verified:',version);}else{fs.mkdirSync(out,{recursive:true});for(const[p,b]of files){fs.mkdirSync(path.dirname(path.join(out,p)),{recursive:true});fs.writeFileSync(path.join(out,p),b);}console.log(JSON.stringify({version,files:files.size,coverage},null,2));}
