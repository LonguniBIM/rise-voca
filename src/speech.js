/** Device speech only. This module deliberately has no learning-history dependency. */
export const ACCENTS = ['Auto','en-GB','en-US','en-AU','en-CA','en-IE','en-NZ'];
export const SPEEDS = [0.75,0.9,1];
export const DEFAULT_SPEECH = Object.freeze({speechLang:'Auto',voiceURI:'',voiceName:'',voiceLang:'',speed:0.9});
const language = value => String(value||'').replaceAll('_','-').toLowerCase();
export const isEnglish = voice => /^en(?:-|$)/.test(language(voice.lang));
export function speechPreferences(value = {}) {
  const p={...DEFAULT_SPEECH};
  if(ACCENTS.includes(value.speechLang)) p.speechLang=value.speechLang;
  if(SPEEDS.includes(Number(value.speed))) p.speed=Number(value.speed);
  for(const key of ['voiceURI','voiceName','voiceLang']) if(typeof value[key]==='string'&&value[key].length<=500) p[key]=value[key];
  return p;
}
export function exactVoice(voices,p) {
  return voices.find(v=>p.voiceURI&&v.voiceURI===p.voiceURI&&(!p.voiceLang||language(v.lang)===language(p.voiceLang))) || voices.find(v=>p.voiceName&&v.name===p.voiceName&&language(v.lang)===language(p.voiceLang)) || null;
}
export function chooseVoice(voices,preferences,offline=false) {
  const p=speechPreferences(preferences), english=voices.filter(isEnglish),local=english.filter(v=>v.localService===true);
  // Offline safety is an explicit exception: prefer a local English pool when available.
  const pool=offline&&local.length?local:english;
  const saved=exactVoice(pool,p); if(saved) return {voice:saved,reason:'saved voice'};
  const accent=pool.filter(v=>language(v.lang)===language(p.speechLang));
  if(accent.length) return {voice:accent.find(v=>v.localService===true)||accent[0],reason:'preferred accent'};
  const otherLocal=pool.find(v=>v.localService===true); if(otherLocal) return {voice:otherLocal,reason:'local English fallback'};
  if(pool.length) return {voice:pool.find(v=>v.default)||pool[0],reason:'English fallback'};
  return {voice:null,reason:'browser/system default; English voice not yet available'};
}
export class SpeechController {
  constructor({synth=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance,getPreferences=()=>DEFAULT_SPEECH,online=()=>globalThis.navigator?.onLine!==false,onChange=()=>{},onStatus=()=>{},win=globalThis.window,doc=globalThis.document,timer=(fn,ms)=>globalThis.setTimeout(fn,ms),clear=id=>globalThis.clearTimeout(id)}={}) {
    Object.assign(this,{synth,Utterance,getPreferences,online,onChange,onStatus,win,doc,timer,clear});
    this.voices=[];this.timers=[];this.listeners=[];this.generation=0;this.current=null;
  }
  refresh() {
    try {this.voices=Array.from(this.synth?.getVoices?.()||[]).filter(isEnglish);} catch {this.voices=[];}
    this.onChange(this.voices,this.selection());return this.voices;
  }
  selection() {return chooseVoice(this.voices,this.getPreferences(),!this.online());}
  scheduleRefresh() {
    this.timers.forEach(id=>this.clear(id));this.timers=[];this.refresh();
    for(const ms of [250,1000,2500]) this.timers.push(this.timer(()=>this.refresh(),ms));
  }
  start() {
    const bind=(target,type,fn)=>{if(target?.addEventListener){target.addEventListener(type,fn);this.listeners.push(()=>target.removeEventListener(type,fn));}};
    bind(this.synth,'voiceschanged',()=>this.refresh());
    bind(this.win,'pageshow',()=>this.scheduleRefresh());
    bind(this.win,'online',()=>this.refresh());bind(this.win,'offline',()=>this.refresh());
    bind(this.doc,'visibilitychange',()=>{if(this.doc.visibilityState==='visible') this.scheduleRefresh();else this.cancel();});
    this.scheduleRefresh();
  }
  cancel() {this.generation++;this.current=null;try{this.synth?.cancel();}catch{/* A failing device must not prevent learning. */}}
  speak(text) {
    if(!this.synth||!this.Utterance) {this.onStatus('Speech is unavailable. Please read the question with your child.');return false;}
    this.refresh();this.cancel();const token=this.generation,p=speechPreferences(this.getPreferences()),selected=this.selection();
    try {
      const utterance=new this.Utterance(text);utterance.lang=selected.voice?.lang||(p.speechLang==='Auto'?'en':p.speechLang);utterance.rate=p.speed;
      if(selected.voice) utterance.voice=selected.voice;
      utterance.onstart=()=>{if(token===this.generation)this.onStatus('Speaking.');};
      utterance.onend=()=>{if(token===this.generation){this.current=null;this.onStatus('Playback finished. Hearing or pronunciation is not assessed.');}};
      utterance.onerror=event=>{if(token===this.generation&&!['canceled','interrupted'].includes(event.error))this.onStatus('Speech could not play ('+event.error+'). Try Refresh voices or another device voice.');};
      this.current=utterance;this.synth.speak(utterance);this.onStatus('Playback requested using '+(selected.voice?.name||'the system default')+'.');return true;
    } catch {this.onStatus('Speech could not start. Tap Listen or Test voice again.');return false;}
  }
  test() {return this.speak('Hello! Let us learn English together. The sun is shining today.');}
  destroy() {this.cancel();this.listeners.forEach(fn=>fn());this.timers.forEach(id=>this.clear(id));}
}
