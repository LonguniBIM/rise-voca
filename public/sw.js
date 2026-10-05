/* Generated manifest values are supplied by scripts/build.mjs. Never clear IndexedDB. */
const VERSION=__VERSION__;
const FILES=__FILES__;
const PREFIX='rise-voca:'+encodeURIComponent(self.registration.scope)+':';
const CACHE=PREFIX+VERSION;
const absolute=path=>new URL(path,self.registration.scope).href;
const marker=absolute('__offline_ready__');
const digest=async buffer=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer))).map(n=>n.toString(16).padStart(2,'0')).join('');
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);let next=0;
  const results=await Promise.allSettled(Array.from({length:3},async()=>{
    while(next<FILES.length){
      const entry=FILES[next++],url=absolute(entry.path),response=await fetch(url,{cache:'reload'});
      if(!response.ok)throw new Error('Offline download failed: '+entry.path);
      const buffer=await response.clone().arrayBuffer();
      if(await digest(buffer)!==entry.sha256)throw new Error('Offline integrity mismatch: '+entry.path);
      await cache.put(url,response);
    }
  }));
  if(results.some(r=>r.status==='rejected')){await caches.delete(CACHE);throw new Error('Incomplete offline pack; no readiness marker written.');}
  await cache.put(marker,new Response(JSON.stringify({version:VERSION,count:FILES.length}),{headers:{'Content-Type':'application/json'}}));
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||!url.href.startsWith(self.registration.scope))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(event.request.mode==='navigate')return await cache.match(absolute('index.html'))||fetch(event.request);
    return await cache.match(event.request,{ignoreSearch:true})||fetch(event.request);
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type!=='CHECK_OFFLINE')return;
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE),saved=await cache.match(marker);
    const missing=[];
    for(const f of FILES)if(!await cache.match(absolute(f.path)))missing.push(f.path);
    event.ports[0]?.postMessage({ready:Boolean(saved)&&missing.length===0,version:VERSION,files:FILES.length,missing});
  })());
});
