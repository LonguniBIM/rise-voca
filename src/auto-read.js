import {activeQuestion,canAnswer} from './core.js';
/** One automatic request per question, never triggered by settings/tests or re-rendering. */
export class AutomaticClueReader {
  constructor({context,speak,record}) {Object.assign(this,{context,speak,record});this.attempted=new Set();}
  async read() {
    const {session,preferences,active,visible,writable}=this.context();
    if(!active||!visible||!writable||!preferences.autoReadClue||!session||!canAnswer(session))return false;
    const q=activeQuestion(session),key=session.id+'|'+q.question.id;
    if(this.attempted.has(key)||q.support.some(e=>e.kind==='listen'&&e.trigger==='automatic'))return false;
    this.attempted.add(key);
    // speak() acknowledges only submission. Neither successful speech nor comprehension is inferred.
    if(this.speak(q.question.question)!==true)return false;
    return this.record(session.id,q.question.id);
  }
}
