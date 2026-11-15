/** Validate attributed, local SVG inputs before they enter a build or offline pack. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {canonical} from '../src/core.js';

const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const fail=(condition,message)=>{if(!condition)throw new Error(message);};
const assetPattern=/^assets\/illustrations\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.svg$/;
const licensePattern=/^assets\/licenses\/[a-z0-9-]+\.txt$/;
const svgElements=new Set(['svg','g','path','rect','circle','ellipse','line','polyline','polygon','defs','clippath','mask','lineargradient','radialgradient','stop','title','desc','style','use']);

export function illustrationIdentity(record){
  // Keep every existing emoji/CSS approval key byte-for-byte compatible.
  const recipe={itemId:record.itemId,kind:record.kind,visual:record.visual,sparkOne:record.sparkOne||'',sparkTwo:record.sparkTwo||'',styleVersion:record.styleVersion};
  if(record.kind==='svg')recipe.assets=[record,...(record.additionalAssets||[])].map(asset=>({path:asset.assetPath,sha256:asset.sha256}));
  return hash(canonical(recipe));
}

export function readIllustrationAssets(root,registry){
  const files=new Map();
  for(const record of registry.records.filter(record=>record.kind==='svg')){
    fail(!record.additionalAssets||(Array.isArray(record.additionalAssets)&&record.additionalAssets.length<=3),'Invalid illustration group: '+record.itemId);
    for(const asset of [record,...(record.additionalAssets||[])]){
      fail(assetPattern.test(asset.assetPath||''),'Unsafe illustration path: '+asset.assetPath);
      fail(/^[a-f0-9]{64}$/.test(asset.sha256||'')&&asset.assetPath.endsWith('-'+asset.sha256.slice(0,12)+'.svg'),'Illustration path must identify its exact bytes: '+record.itemId);
      for(const field of ['provider','creator','sourceVersion','attribution'])
        fail(typeof asset[field]==='string'&&asset[field].trim(),'Missing illustration '+field+': '+record.itemId);
      fail(/^[a-f0-9]{40}$/.test(asset.sourceVersion),'Pin the illustration source commit: '+record.itemId);
      for(const field of ['sourceUrl','licenseUrl'])
        fail(typeof asset[field]==='string'&&/^https:\/\/[^\s]+$/.test(asset[field]),'Invalid illustration '+field+': '+record.itemId);
      fail(['CC-BY-SA-4.0','CC-BY-3.0','Apache-2.0'].includes(asset.license),'Unsupported illustration license: '+record.itemId);
      fail(licensePattern.test(asset.licensePath||''),'Missing local illustration license: '+record.itemId);
      const bytes=fs.readFileSync(path.join(root,asset.assetPath)),svg=bytes.toString('utf8');
      fail(hash(bytes)===asset.sha256,'Illustration hash mismatch: '+asset.assetPath);
      fail(bytes.length<=500000&&/<svg\b/i.test(svg)&&/\bviewBox\s*=/i.test(svg)&&/<\/svg>\s*$/i.test(svg),'Invalid SVG document: '+asset.assetPath);
      fail(!/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet|<(?:script|foreignObject|iframe|object|embed|image|audio|video|text|animate|set)\b|\bon[a-z]+\s*=|@import|javascript:/i.test(svg),'Unsafe SVG content: '+asset.assetPath);
      for(const match of svg.matchAll(/<\s*([a-z][\w:.-]*)\b/gi))
        fail(svgElements.has(match[1].toLowerCase()),'Unsupported SVG element: '+asset.assetPath);
      for(const match of svg.matchAll(/(?:href|xlink:href)\s*=\s*(["'])(.*?)\1/gi))
        fail(/^#[a-z0-9_-]+$/i.test(match[2]),'External SVG reference: '+asset.assetPath);
      for(const match of svg.matchAll(/url\s*\(([^)]*)\)/gi))
        fail(/^["']?#[a-z0-9_-]+["']?$/i.test(match[1].trim()),'External SVG style: '+asset.assetPath);
      files.set(asset.assetPath,bytes);
      const license=fs.readFileSync(path.join(root,asset.licensePath));
      fail(license.length>50,'Empty illustration license: '+record.itemId);
      files.set(asset.licensePath,license);
    }
  }
  return files;
}
