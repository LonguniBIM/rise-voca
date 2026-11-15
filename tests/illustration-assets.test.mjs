import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {loadCatalog} from '../scripts/catalog.mjs';
import {checkDirectory} from '../scripts/check-pages.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

function fixture(){
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'rise-art-'));
  for(const name of ['scripts','src','data','public','assets','index.html','package.json','THIRD_PARTY.md'])
    fs.cpSync(path.join(root,name),path.join(directory,name),{recursive:true});
  return directory;
}
const build=directory=>execFileSync(process.execPath,['scripts/build.mjs'],{cwd:directory,stdio:'pipe'});

test('previously missing pictures gain local, attributed candidates without replacing existing emoji',()=>{
  const {registry:before}=loadCatalog(root,{throughFile:'data/lesson-packs/2026-11-08-toy-factory.json'});
  const {library,registry}=loadCatalog(root);
  const head=registry.records.find(record=>record.itemId==='head');
  assert.equal(head.kind,'svg');
  assert.equal(head.status,'needs-review');
  assert.equal(head.provider,'Mulberry Symbols');
  assert.equal(head.license,'CC-BY-SA-4.0');
  assert.equal(digest(fs.readFileSync(path.join(root,head.assetPath))),head.sha256);
  assert(fs.readFileSync(path.join(root,head.licensePath),'utf8').includes('4.0'));
  for(const old of before.records.filter(record=>record.kind!=='missing')){
    assert.deepEqual(registry.records.find(record=>record.itemId===old.itemId),old,old.itemId);
  }
  assert.equal(library.items.find(item=>item.id==='earth-sense-pending').meaning,'đất / mặt đất');
});

test('licensed pictures and notices are hashed into the offline publishing bundle',()=>{
  const directory=fixture();
  try{
    build(directory);
    const read=name=>JSON.parse(fs.readFileSync(path.join(directory,'dist',name)));
    const registry=read('data/illustrations.json'),offline=read('offline-manifest.json');
    for(const image of registry.records.filter(record=>record.kind==='svg')){
      const asset=path.join(directory,'dist',image.assetPath);
      assert(fs.existsSync(asset),'Picture must ship with the app: '+image.itemId);
      assert.equal(digest(fs.readFileSync(asset)),image.sha256);
      assert.equal(offline.files.find(file=>file.path===image.assetPath)?.sha256,image.sha256);
      assert(offline.files.some(file=>file.path===image.licensePath));
    }
    assert(offline.files.some(file=>file.path==='THIRD_PARTY.md'));
  }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

test('publishing rejects an illustration omitted from the offline manifest',()=>{
  const directory=fixture();
  try{
    build(directory);
    const output=path.join(directory,'dist'),file=path.join(output,'offline-manifest.json');
    const offline=JSON.parse(fs.readFileSync(file));
    offline.files=offline.files.filter(entry=>!entry.path.includes('/head-'));
    fs.writeFileSync(file,JSON.stringify(offline));
    assert.throws(()=>checkDirectory(output),/Illustration dependency is not cached/);
  }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

test('changing one group component requires a new approval and offline build identity',()=>{
  const directory=fixture();
  try{
    build(directory);
    const read=name=>JSON.parse(fs.readFileSync(path.join(directory,'dist',name)));
    const before=read('data/illustrations.json'),oldVersion=read('BUILD_INFO.json').version;
    const packPath=path.join(directory,'data/lesson-packs/2026-11-15b-illustrations.json');
    const pack=JSON.parse(fs.readFileSync(packPath));
    const feet=pack.illustrations.find(record=>record.itemId==='body-parts').additionalAssets[1];
    const bytes=Buffer.from(fs.readFileSync(path.join(directory,feet.assetPath),'utf8').replace('</svg>','<!-- test-only byte revision --></svg>'));
    const nextHash=digest(bytes);
    feet.assetPath=feet.assetPath.replace(feet.sha256.slice(0,12),nextHash.slice(0,12));feet.sha256=nextHash;
    fs.writeFileSync(path.join(directory,feet.assetPath),bytes);fs.writeFileSync(packPath,JSON.stringify(pack));
    build(directory);
    const after=read('data/illustrations.json');
    for(const old of before.records){
      const next=after.records.find(record=>record.itemId===old.itemId);
      if(old.itemId==='body-parts')assert.notEqual(next.identity,old.identity);
      else assert.equal(next.identity,old.identity,old.itemId+' must retain its approval identity');
    }
    assert.notEqual(read('BUILD_INFO.json').version,oldVersion);
    assert.equal(read('offline-manifest.json').files.find(file=>file.path===feet.assetPath)?.sha256,nextHash);
  }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

test('source validation rejects active SVGs, remote references and changed asset bytes',()=>{
  const directory=fixture();
  try{
    const packPath=path.join(directory,'data/lesson-packs/2026-11-15b-illustrations.json');
    const original=JSON.parse(fs.readFileSync(packPath));
    const head=original.illustrations.find(record=>record.itemId==='head');
    const svg=fs.readFileSync(path.join(directory,head.assetPath),'utf8');
    for(const payload of ['<script>alert(1)</script>','<s:script xmlns:s="http://www.w3.org/2000/svg"/>','<use href="https://example.test/tracker.svg#shape"/>']){
      const pack=structuredClone(original),record=pack.illustrations.find(record=>record.itemId==='head');
      const bytes=Buffer.from(svg.replace('</svg>',payload+'</svg>')),sha256=digest(bytes);
      record.assetPath=record.assetPath.replace(record.sha256.slice(0,12),sha256.slice(0,12));record.sha256=sha256;
      fs.writeFileSync(path.join(directory,record.assetPath),bytes);fs.writeFileSync(packPath,JSON.stringify(pack));
      assert.throws(()=>build(directory),/Unsafe SVG content|Unsupported SVG element|External SVG reference/);
    }
    fs.writeFileSync(packPath,JSON.stringify(original));
    fs.appendFileSync(path.join(directory,head.assetPath),' ');
    assert.throws(()=>build(directory),/Illustration hash mismatch/);
  }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
