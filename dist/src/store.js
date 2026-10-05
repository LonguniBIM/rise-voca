import {clone,uid,mergePlan,validateSession} from './core.js';
import {speechPreferences} from './speech.js';
export const DB_NAME='rise-voca-v1';
const request=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
const completion=tx=>new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error||new Error('Transaction aborted'));tx.onerror=()=>{};});
/** Database-wide short lease plus transaction-level ownership checks. Never deleteDatabase. */
export class Store {
  constructor() {this.db=null;this.memory=false;this.owner=uid();this.writer=false;this.sessions=new Map();this.meta=new Map();this.queue=Promise.resolve();this.onState=()=>{};}
  async open() {
    try {
      const r=indexedDB.open(DB_NAME,1);
      r.onupgradeneeded=()=>{for(const name of ['sessions','meta']) if(!r.result.objectStoreNames.contains(name)) r.result.createObjectStore(name,{keyPath:'id'});};
      this.db=await new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('Storage upgrade blocked; close other app windows.'));});
      this.db.onversionchange=()=>{this.writer=false;this.db.close();this.onState('Storage version changed. Save a backup and reopen.');};
      await this.acquire();
      this.interval=setInterval(()=>this.acquire().catch(e=>this.onState(e.message)),5000);
    } catch(e) {this.memory=true;this.writer=true;this.onState('Temporary memory only: '+e.message+'. Export a backup before closing.');}
    return this;
  }
  serial(fn) {const job=this.queue.then(fn);this.queue=job.catch(()=>{});return job;}
  async acquire() {
    if(this.memory)return true;
    return this.serial(async()=>{
      const tx=this.db.transaction('meta','readwrite'),done=completion(tx);done.catch(()=>{});const meta=tx.objectStore('meta');
      const lease=await request(meta.get('writer-lease')),now=Date.now();
      const acquired=!lease||lease.owner===this.owner||lease.until<now;
      if(acquired)meta.put({id:'writer-lease',owner:this.owner,until:now+15000});
      await done;const changed=this.writer!==acquired;this.writer=acquired;if(changed)this.onState(acquired?'Editing is available on this tab.':'Read-only: another Rise_Voca tab is active.');return acquired;
    });
  }
  async write(operation) {
    return this.serial(async()=>{
      if(this.memory)return operation(null);
      const tx=this.db.transaction(['sessions','meta'],'readwrite'),done=completion(tx);done.catch(()=>{});
      try {
        const lease=await request(tx.objectStore('meta').get('writer-lease'));
        if(!lease||lease.owner!==this.owner||lease.until<Date.now()) {this.writer=false;throw new Error('Read-only: writer lease changed. Reopen this screen after the other tab closes.');}
        tx.objectStore('meta').put({...lease,until:Date.now()+15000});
        const result=await operation(tx);await done;return result;
      } catch(e) {try{tx.abort();}catch{}await done.catch(()=>{});throw e;}
    });
  }
  async allSessions() {if(this.memory)return clone([...this.sessions.values()]);return request(this.db.transaction('sessions').objectStore('sessions').getAll());}
  async saveSession(session,expectedRevision=session.revision) {
    return this.write(async tx=>{
      const old=tx?await request(tx.objectStore('sessions').get(session.id)):this.sessions.get(session.id);
      if((old?.revision||0)!==expectedRevision)throw new Error('Session changed in another writer. Your saved history was not overwritten.');
      const next={...clone(session),revision:expectedRevision+1};validateSession(next);
      if(tx)tx.objectStore('sessions').put(next);else this.sessions.set(next.id,clone(next));return next;
    });
  }
  async readMeta(id, fallback) {const value=this.memory?this.meta.get(id):await request(this.db.transaction('meta').objectStore('meta').get(id));return clone(value?.value??fallback);}
  async setMeta(id,value) {return this.write(tx=>{const row={id,value:clone(value)};if(tx)tx.objectStore('meta').put(row);else this.meta.set(id,row);return clone(value);});}
  async getPreferences() {return speechPreferences(await this.readMeta('settings',{}));}
  async savePreferences(value) {return this.setMeta('settings',speechPreferences(value));}
  async saveReview(key,value) {return this.write(async tx=>{const r=tx?await request(tx.objectStore('meta').get('image-reviews')):this.meta.get('image-reviews');const next={...(r?.value||{}),[key]:clone(value)};if(tx)tx.objectStore('meta').put({id:'image-reviews',value:next});else this.meta.set('image-reviews',{id:'image-reviews',value:next});return clone(next);});}
  async restore(backup) {
    return this.write(async tx=>{
      const existing=tx?await request(tx.objectStore('sessions').getAll()):[...this.sessions.values()];const plan=mergePlan(existing,backup.sessions);
      for(const s of plan.additions)if(tx)tx.objectStore('sessions').put(clone(s));else this.sessions.set(s.id,clone(s));
      return {added:plan.additions.length,identical:plan.identical};
    });
  }
  async release() {
    clearInterval(this.interval);
    if(this.memory||!this.db)return;
    try{const tx=this.db.transaction('meta','readwrite'),done=completion(tx),meta=tx.objectStore('meta');const lease=await request(meta.get('writer-lease'));if(lease?.owner===this.owner)meta.delete('writer-lease');await done;}catch{}
    this.writer=false;
  }
}
