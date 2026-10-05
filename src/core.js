/** Pure learning domain. No DOM, storage, speech, or network side effects. */
export const APP_VERSION = '1.0.0';
export const LIBRARY_ID = 'rise-voca-pk1';
export const SCHEMA_VERSION = 1;
export const TIMEZONE = 'Asia/Ho_Chi_Minh';
export const nowISO = () => new Date().toISOString();
export const clone = value => structuredClone(value);
export const uid = () => crypto.randomUUID();
export function insist(condition, message) { if (!condition) throw new Error(message); }
export function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
export function shuffle(values, random = Math.random) {
  const a = [...values];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function validateQuestion(q) {
  insist(q && typeof q === 'object', 'Invalid question');
  for (const k of ['id','itemId','word','question','hint','explanation','topicId','mode']) insist(typeof q[k] === 'string' && q[k].length > 0 && q[k].length < 4000, 'Invalid question ' + k);
  insist(Array.isArray(q.options) && q.options.length === 4, 'Exactly four choices required');
  insist(q.options.every(o => typeof o.id === 'string' && o.id.length > 0 && o.id.length < 200 && typeof o.label === 'string' && o.label.trim() && o.label.length < 200), 'Invalid choice');
  insist(new Set(q.options.map(o => o.id)).size === 4 && new Set(q.options.map(o => o.label)).size === 4, 'Duplicate choices');
  insist(q.options.filter(o => o.id === q.correctOptionId).length === 1, 'Exactly one correct choice required');
  insist(['context','picture','letter','number','color'].includes(q.mode), 'Unknown question mode');
}
export function validateLibrary(lib) {
  insist(lib.libraryId === LIBRARY_ID && lib.schemaVersion === 1, 'Unsupported library');
  for (const field of ['items','lessons','topics','sources']) {
    insist(Array.isArray(lib[field]), 'Missing ' + field);
    insist(new Set(lib[field].map(x => x.id)).size === lib[field].length, 'Duplicate ' + field + ' IDs');
  }
  const items = new Map(lib.items.map(i => [i.id,i]));
  for (const item of lib.items) {
    insist(item.status === 'ready' || item.status === 'pending', 'Unknown content status');
    if (item.status === 'ready') { validateQuestion(item.question); insist(item.question.itemId === item.id, 'Item/question mismatch'); }
    else insist(typeof item.reason === 'string' && item.reason.length > 0, 'Pending item needs a reason');
  }
  for (const lesson of lib.lessons) {
    insist(lesson.targets.length > 0 && new Set(lesson.targets.map(t => t.itemId)).size === lesson.targets.length, 'Empty/duplicate lesson targets');
    insist(lesson.targets.every(t => items.has(t.itemId) && ['core','key'].includes(t.role)), 'Missing target or role');
    insist(lib.topics.some(t => t.id === lesson.topicId), 'Missing topic');
  }
  return true;
}
export function lessonReadiness(lib, lesson) {
  const missing = lesson.targets.filter(t => lib.items.find(i => i.id === t.itemId)?.status !== 'ready');
  const gaps = lesson.targets.filter(t => lib.items.find(i => i.id === t.itemId)?.recordType === 'source-gap');
  return {ready: missing.length === 0, required: lesson.targets.length - gaps.length, available: lesson.targets.length - missing.length, unknownTotal: gaps.length > 0, missing};
}
export function questionPool(lib, lessonIds, mode = 'review', practiceIds = null) {
  const lessons = lib.lessons.filter(l => lessonIds.includes(l.id));
  insist(lessons.length === new Set(lessonIds).size && lessons.length > 0, 'Select an existing lesson');
  if (mode === 'lesson') {
    insist(lessons.length === 1, 'Full lesson requires exactly one lesson');
    insist(lessonReadiness(lib, lessons[0]).ready, 'This lesson has unresolved source targets. Use partial review or confirm the source first.');
  }
  const pool = new Map();
  for (const lesson of lessons) for (const target of lesson.targets) {
    const item = lib.items.find(i => i.id === target.itemId);
    if (item.status !== 'ready' || (practiceIds && !practiceIds.has(item.id))) continue;
    if (!pool.has(item.id)) pool.set(item.id, {...clone(item.question), meaning: item.meaning, sourceRefs: clone(item.sourceRefs), topicId: lesson.topicId, topicIds: [], lessonIds: [], lessonNames: [], roles: []});
    const q = pool.get(item.id); if (!q.topicIds.includes(lesson.topicId)) q.topicIds.push(lesson.topicId); q.lessonIds.push(lesson.id); q.lessonNames.push(lesson.name); q.roles.push(target.role);
  }
  // Case matters for explicit uppercase/lowercase learning targets.
  if (mode === 'lesson') return [...pool.values()];
  const answerKeys = new Set();
  return [...pool.values()].filter(q => {
    const key = q.mode === 'letter' ? q.itemId : q.word.trim().toLocaleLowerCase('en');
    if (answerKeys.has(key)) return false; answerKeys.add(key); return true;
  });
}
export function createSession(lib, lessonIds, mode = 'lesson', count = 'all', practiceIds = null, random = Math.random, at = nowISO()) {
  insist(['lesson','review','practice'].includes(mode), 'Unknown session mode');
  let pool = questionPool(lib, lessonIds, mode, practiceIds);
  const requested = mode === 'lesson' || count === 'all' ? pool.length : Number(count);
  insist(Number.isInteger(requested) && requested >= 1 && requested <= pool.length, 'Question count must be between 1 and ' + pool.length);
  if (mode !== 'lesson') pool = shuffle(pool, random).slice(0,requested);
  const questions = pool.map(q => ({question:{...q,options:shuffle(q.options,random)},seenAt:null,attempts:[],support:[],firstCorrect:null,skippedAt:null}));
  questions[0].seenAt = at;
  return {schemaVersion:1,libraryId:lib.libraryId,libraryVersion:lib.contentVersion,libraryFingerprint:lib.fingerprint || '',appVersion:APP_VERSION,id:uid(),revision:0,mode,lessonIds:[...lessonIds],lessonNames:lib.lessons.filter(l => lessonIds.includes(l.id)).map(l => l.name),startedAt:at,lastActivityAt:at,endedAt:null,timezone:TIMEZONE,status:'in-progress',paused:false,phase:'question',index:0,roundSize:4,requestedCount:requested,activeMs:0,questions};
}
export function questionTopics(q) { return Array.isArray(q.topicIds) && q.topicIds.length ? q.topicIds : [q.topicId]; }
export function activeQuestion(s) { return s.questions[s.index]; }
export function canAnswer(s) { const q = activeQuestion(s); return s.status === 'in-progress' && !s.paused && s.phase === 'question' && q && !q.firstCorrect && !q.skippedAt; }
export function supportCounts(q) {
  const count = kind => q.support.filter(e => e.kind === kind).length;
  return {hints:count('hint'),listens:count('listen'),transcripts:count('transcript'),lettersRevealed:0};
}
export function submitAnswer(s, optionId, eventId = uid(), at = nowISO()) {
  if (!canAnswer(s)) return false;
  const q = activeQuestion(s);
  if (q.attempts.some(a => a.id === eventId)) return false;
  const option = q.question.options.find(o => o.id === optionId);
  insist(option, 'Unknown answer ID');
  const correct = optionId === q.question.correctOptionId;
  q.attempts.push({id:eventId,at,optionId,answer:option.label,correct,support:supportCounts(q)});
  s.lastActivityAt = at;
  if (correct) q.firstCorrect = {at,attemptId:eventId,attempts:q.attempts.length,...supportCounts(q)};
  return true;
}
export function addSupport(s, kind, at = nowISO(), trigger = 'manual') {
  if (!canAnswer(s)) return false;
  insist(['hint','listen','transcript'].includes(kind), 'Unknown support');
  const q = activeQuestion(s);
  if (kind !== 'listen' && q.support.some(e => e.kind === kind)) return false;
  insist(['manual','automatic'].includes(trigger), 'Invalid listening trigger');
  if (kind === 'listen' && trigger === 'automatic' && q.support.some(e => e.kind === 'listen' && e.trigger === 'automatic')) return false;
  q.support.push({id:uid(),kind,at,...(kind === 'listen' ? {trigger} : {})}); s.lastActivityAt = at; return true;
}
export function skipQuestion(s, at = nowISO()) {
  if (!canAnswer(s)) return false;
  activeQuestion(s).skippedAt = at; s.lastActivityAt = at; return advance(s,at);
}
export function advance(s, at = nowISO()) {
  const q = activeQuestion(s);
  if (s.status !== 'in-progress' || s.paused || s.phase !== 'question' || (!q.firstCorrect && !q.skippedAt)) return false;
  if (s.index === s.questions.length - 1) { s.status='completed'; s.phase='finished'; s.endedAt=at; }
  else { s.index++; s.phase=s.index % s.roundSize === 0 ? 'break' : 'question'; if (s.phase === 'question') s.questions[s.index].seenAt ||= at; }
  s.lastActivityAt=at; return true;
}
export function continueRound(s, at = nowISO()) { if (s.status !== 'in-progress' || s.phase !== 'break' || s.paused) return false; s.phase='question'; activeQuestion(s).seenAt ||= at; s.lastActivityAt=at; return true; }
export function pause(s, at = nowISO()) { if(s.status !== 'in-progress') return false; s.paused=true;s.lastActivityAt=at;return true; }
export function resume(s, at = nowISO()) { if(s.status !== 'in-progress') return false;s.paused=false;s.lastActivityAt=at;return true; }
export function endEarly(s, at = nowISO()) { if(s.status !== 'in-progress') return false;s.status='ended-early';s.endedAt=at;s.lastActivityAt=at;s.paused=true;return true; }
export function outcome(q) { return q.firstCorrect ? 'solved' : q.skippedAt ? 'skipped' : q.seenAt ? 'unfinished' : 'unseen'; }
export function needsPractice(q) { return Boolean(q.seenAt && (!q.firstCorrect || q.firstCorrect.attempts > 1 || q.firstCorrect.hints > 0 || q.firstCorrect.transcripts > 0)); }
export function metrics(s) {
  const qs=s.questions, sum=fn=>qs.reduce((a,q)=>a+fn(q),0);
  const seen=sum(q=>Number(Boolean(q.seenAt))),solved=sum(q=>Number(Boolean(q.firstCorrect)));
  return {planned:qs.length,seen,solved,skipped:sum(q=>Number(Boolean(q.skippedAt))),unseen:qs.length-seen,attempted:sum(q=>Number(q.attempts.length>0)),attempts:sum(q=>q.attempts.length),firstTry:sum(q=>Number(q.firstCorrect?.attempts===1)),unassisted:sum(q=>Number(q.firstCorrect?.attempts===1 && !q.firstCorrect.hints && !q.firstCorrect.transcripts)),hints:sum(q=>supportCounts(q).hints),listens:sum(q=>supportCounts(q).listens),transcripts:sum(q=>supportCounts(q).transcripts),activeMs:s.activeMs,elapsedMs:Math.max(0,Date.parse(s.endedAt||s.lastActivityAt)-Date.parse(s.startedAt))};
}
export function practiceItemIds(sessions) {
  const latest=new Map();
  for(const s of sessions) for(const q of s.questions) if(q.seenAt) {
    const at=q.firstCorrect?.at||q.skippedAt||q.attempts.at(-1)?.at||q.seenAt;
    if(!latest.has(q.question.itemId)||at>latest.get(q.question.itemId).at) latest.set(q.question.itemId,{at,q});
  }
  return new Set([...latest].filter(([,v])=>needsPractice(v.q)).map(([id])=>id));
}
export function dateBoundary(value, end = false) {
  if(!value) return end?Infinity:-Infinity;
  insist(/^\d{4}-\d{2}-\d{2}$/.test(value), 'Invalid date');
  const d=Date.parse(value+'T00:00:00+07:00');
  insist(Number.isFinite(d) && new Date(d+7*3600000).toISOString().slice(0,10)===value,'Invalid calendar date');
  return d+(end?86400000:0);
}
export function filterSessions(sessions, filters={}) {
  const from=dateBoundary(filters.from),to=dateBoundary(filters.to,true);
  insist(from<to,'From date must not follow To date');
  return sessions.filter(s=>{
    const start=Date.parse(s.startedAt);
    return start>=from && start<to && (!filters.status||s.status===filters.status) && (!filters.topic||s.questions.some(q=>q.seenAt&&questionTopics(q.question).includes(filters.topic))) && (!filters.lesson||s.questions.some(q=>q.seenAt&&q.question.lessonIds.includes(filters.lesson)));
  }).sort((a,b)=>b.startedAt.localeCompare(a.startedAt));
}
export function wordRows(sessions, search='') {
  const rows=new Map();
  for(const s of sessions) for(const q of s.questions) if(q.seenAt) {
    const key=q.question.itemId;
    if(!rows.has(key)) rows.set(key,{id:key,word:q.question.word,meaning:q.question.meaning,topicId:q.question.topicId,sessions:0,correct:0,attempts:0,hints:0,listens:0,transcripts:0,firstCorrect:null,lastActivity:null,lastOutcome:'',needsPractice:false});
    const r=rows.get(key),support=supportCounts(q),at=q.firstCorrect?.at||q.skippedAt||q.attempts.at(-1)?.at||q.seenAt;
    r.sessions++;r.correct+=Number(Boolean(q.firstCorrect));r.attempts+=q.attempts.length;r.hints+=support.hints;r.listens+=support.listens;r.transcripts+=support.transcripts;
    if(q.firstCorrect && (!r.firstCorrect||q.firstCorrect.at<r.firstCorrect)) r.firstCorrect=q.firstCorrect.at;
    if(!r.lastActivity||at>=r.lastActivity) {r.lastActivity=at;r.lastOutcome=outcome(q);r.needsPractice=needsPractice(q);}
  }
  return [...rows.values()].filter(r=>(r.word+' '+r.meaning).toLocaleLowerCase().includes(search.toLocaleLowerCase())).sort((a,b)=>a.word.localeCompare(b.word));
}
export function localTime(at) { return at ? new Intl.DateTimeFormat('en-GB',{timeZone:TIMEZONE,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(at)) : '-'; }
export function csv(rows) {
  return '\uFEFF'+rows.map(row=>row.map(v=>{ let text=String(v??'');if(/^[\s]*[=+@-]/.test(text)) text="'"+text;return '"'+text.replaceAll('"','""')+'"'; }).join(',')).join('\r\n');
}
export function parentSummary(s) {
  const m=metrics(s);
  return ['Rise_Voca result (not a full backup)','Session: '+s.id,'Lesson(s): '+s.lessonNames.join('; '),'Started: '+localTime(s.startedAt)+' '+s.timezone,'Mode: '+s.mode+' | Status: '+s.status,'Seen: '+m.seen+'/'+m.planned+'; solved: '+m.solved+'; skipped: '+m.skipped+'; unseen: '+m.unseen,'First-try stars: '+m.firstTry+'/'+m.planned+' planned; '+m.firstTry+'/'+m.attempted+' attempted','Unassisted first-try: '+m.unassisted,'Attempts: '+m.attempts+'; hints: '+m.hints+'; listening requests: '+m.listens,'Needs practice: '+(s.questions.filter(needsPractice).map(q=>q.question.word).join(', ')||'None among seen items'),'Device clock timestamps; no speaking or mastery assessment.'].join('\n');
}
function validTime(x,nullable=false) { return (nullable&&x===null)||(typeof x==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x) && Number.isFinite(Date.parse(x)) && new Date(x).toISOString()===x); }
function safeObject(value, depth=0) {
  insist(depth<32,'Backup nesting limit');
  if(typeof value==='string') insist(value.length<=12000,'Backup string limit');
  if(value && typeof value==='object') for(const [k,v] of Object.entries(value)) {insist(!['__proto__','prototype','constructor'].includes(k),'Unsafe backup key');safeObject(v,depth+1);}
}
export function validateSession(s) {
  insist(s && s.schemaVersion===1 && s.libraryId===LIBRARY_ID,'Incompatible session');
  insist(typeof s.id==='string' && /^[a-zA-Z0-9_-]{1,100}$/.test(s.id),'Invalid session ID');
  insist(Number.isInteger(s.revision)&&s.revision>=0,'Invalid revision');
  for(const k of ['libraryVersion','libraryFingerprint','appVersion','timezone']) insist(typeof s[k]==='string' && s[k].length<300,'Missing session version/timezone');
  for(const k of ['startedAt','lastActivityAt']) insist(validTime(s[k]),'Invalid '+k);
  insist(validTime(s.endedAt,true),'Invalid endedAt');
  insist(['in-progress','completed','ended-early'].includes(s.status) && ['question','break','finished'].includes(s.phase) && ['lesson','review','practice'].includes(s.mode),'Invalid session state');
  insist(typeof s.paused==='boolean' && Number.isFinite(s.activeMs) && s.activeMs>=0,'Invalid timing');
  insist(Array.isArray(s.lessonIds) && s.lessonIds.length>0 && s.lessonIds.every(x=>typeof x==='string') && Array.isArray(s.lessonNames) && s.lessonNames.length===s.lessonIds.length,'Invalid lesson references');
  insist(Array.isArray(s.questions) && s.questions.length>=1 && s.questions.length<=300 && s.requestedCount===s.questions.length,'Invalid questions/count');
  insist(Number.isInteger(s.index) && s.index>=0 && s.index<s.questions.length && s.roundSize===4,'Invalid cursor');
  insist(new Set(s.questions.map(q=>q.question.itemId)).size===s.questions.length,'Duplicate session targets');
  const events=new Set();
  for(const [index,q] of s.questions.entries()) {
    validateQuestion(q.question);
    insist(typeof q.question.meaning==='string' && Array.isArray(q.question.lessonIds) && q.question.lessonIds.length>0 && q.question.lessonIds.every(id=>s.lessonIds.includes(id)),'Invalid snapshot references');
    insist(Array.isArray(q.question.lessonNames)&&q.question.lessonNames.length===q.question.lessonIds.length&&q.question.lessonNames.every(x=>typeof x==='string')&&Array.isArray(q.question.sourceRefs),'Invalid snapshot source metadata');
    insist(validTime(q.seenAt,true)&&validTime(q.skippedAt,true),'Invalid question time');
    insist(Array.isArray(q.attempts)&&q.attempts.length<=1000&&Array.isArray(q.support)&&q.support.length<=1000,'Event limits');
    for(const ev of [...q.support,...q.attempts]) {insist(typeof ev.id==='string' && ev.id.length>0 && ev.id.length<200 && !events.has(ev.id) && validTime(ev.at),'Invalid/duplicate event');events.add(ev.id);}
    insist(q.support.filter(e=>e.kind==='hint').length<=1&&q.support.filter(e=>e.kind==='transcript').length<=1,'Duplicate one-time support');
    for(const e of q.support) { insist(['hint','listen','transcript'].includes(e.kind),'Unknown support event'); if(e.trigger!==undefined) insist(e.kind==='listen'&&['manual','automatic'].includes(e.trigger),'Invalid listen trigger'); }
    insist(q.support.filter(e=>e.kind==='listen'&&e.trigger==='automatic').length<=1,'Duplicate automatic clue request');
    for(const a of q.attempts) {
      const option=q.question.options.find(o=>o.id===a.optionId);
      insist(option && a.answer===option.label && a.correct===(a.optionId===q.question.correctOptionId),'Invalid attempt evidence');
      insist(a.support && ['hints','listens','transcripts','lettersRevealed'].every(k=>Number.isInteger(a.support[k])&&a.support[k]>=0),'Invalid support snapshot');
      const totals=supportCounts(q);insist(['hints','listens','transcripts','lettersRevealed'].every(k=>a.support[k]<=totals[k]),'Fabricated support counts');
    }
    const correct=q.attempts.filter(a=>a.correct);
    insist(correct.length<=1,'Duplicate first correct');
    if(q.firstCorrect) {
      const f=q.firstCorrect,a=q.attempts.at(-1);
      insist(correct.length===1&&a.correct&&f.attemptId===a.id&&f.at===a.at&&f.attempts===q.attempts.length,'Invalid first-correct evidence');
      insist(['hints','listens','transcripts','lettersRevealed'].every(k=>f[k]===a.support[k]),'First-correct support mismatch');
    } else insist(correct.length===0,'Missing first-correct record');
    insist(!(q.firstCorrect&&q.skippedAt),'Solved and skipped');
    insist(q.seenAt || (!q.attempts.length&&!q.support.length&&!q.firstCorrect&&!q.skippedAt),'Unseen item with events');
    if(index<s.index || s.status==='completed') insist(q.firstCorrect||q.skippedAt,'Cursor skips unfinished target');
    if(index>s.index) insist(!q.seenAt,'Future target already seen');
  }
  insist(s.status==='in-progress'?s.endedAt===null:s.endedAt!==null,'End state mismatch');
  if(s.status==='in-progress')insist(s.phase!=='finished'&&(s.phase==='break'?s.index>0&&s.index%s.roundSize===0&&!activeQuestion(s).seenAt:Boolean(activeQuestion(s).seenAt)),'Invalid active phase');
  if(s.status==='completed') insist(s.phase==='finished'&&s.index===s.questions.length-1,'Invalid completion');
  return true;
}
export function makeBackup(sessions, library) { return {kind:'rise-voca-history-backup',schemaVersion:1,libraryId:LIBRARY_ID,libraryVersion:library.contentVersion,appVersion:APP_VERSION,exportedAt:nowISO(),timezone:TIMEZONE,scope:'all sessions including unfinished; preferences and image reviews exported separately',sessions:clone(sessions)}; }
export function validateBackup(raw) {
  insist(typeof raw==='string' && new TextEncoder().encode(raw).length<=8*1024*1024,'Backup exceeds 8 MiB');
  const b=JSON.parse(raw);safeObject(b);
  insist(b.kind==='rise-voca-history-backup'&&b.schemaVersion===1&&b.libraryId===LIBRARY_ID&&validTime(b.exportedAt),'Not a compatible full history backup');
  insist(Array.isArray(b.sessions)&&b.sessions.length<=10000,'Session limit');
  insist(new Set(b.sessions.map(s=>s.id)).size===b.sessions.length,'Duplicate backup session IDs');
  b.sessions.forEach(validateSession); return b;
}
export function mergePlan(existing,incoming) {
  const byId=new Map(existing.map(s=>[s.id,s])), additions=[];let identical=0;
  for(const s of incoming) {if(!byId.has(s.id)) additions.push(s);else if(canonical(byId.get(s.id))===canonical(s)) identical++;else throw new Error('Conflicting session '+s.id+'. Nothing was imported.');}
  return {additions,identical};
}
