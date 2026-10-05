"""Real-origin Chromium integration tests. Use only disposable profiles and fixture voices.
Does not establish real-device installation or audible speech. Requires HTTP localhost.
"""
import argparse, copy, functools, http.server, json, os, shutil, tempfile, threading, time
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
MOCK="""(() => {
 let voices=[];window.__speech=[];
 const synth=new EventTarget();synth.getVoices=()=>voices;synth.cancel=()=>{};
 synth.speak=u=>{window.__speech.push({text:u.text,rate:u.rate,voice:u.voice?.name||null,lang:u.lang});u.onend?.();};
 Object.defineProperty(window,'speechSynthesis',{value:synth});
 Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class{constructor(text){this.text=text;}}});
 window.__setVoices=items=>{voices=items;synth.dispatchEvent(new Event('voiceschanged'));};
})()"""
VOICES=[{'name':'Fixture UK','lang':'en-GB','voiceURI':'fixture:gb','localService':True}, {'name':'Fixture US','lang':'en-US','voiceURI':'fixture:us','localService':True}]
READ="""async () => {const db=await new Promise((res,rej)=>{const r=indexedDB.open('rise-voca-v1',1);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});const tx=db.transaction(['sessions','meta']);const get=name=>new Promise((res,rej)=>{const r=tx.objectStore(name).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});const [sessions,meta]=await Promise.all([get('sessions'),get('meta')]);db.close();return {sessions,meta};}"""
def run(report):
 checks=[];errors=[];network=[];failure_requests=[]
 class Handler(http.server.SimpleHTTPRequestHandler):
  corrupt=False
  def log_message(self,*args): pass
  def do_GET(self):
   if self.corrupt and '/data/weeks/week-2026-05-04.json' in self.path:
    failure_requests.append(self.path);self.send_error(503);return
   super().do_GET()
 with tempfile.TemporaryDirectory(prefix='rise-test-') as temp:
  temp=Path(temp);(temp/'rise-voca').symlink_to(ROOT/'dist',target_is_directory=True)
  server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(temp)));threading.Thread(target=server.serve_forever,daemon=True).start()
  base=f'http://127.0.0.1:{server.server_port}/rise-voca/'
  def ok(name):checks.append({'name':name,'status':'PASS'});print('PASS',name,flush=True)
  def state(page):return page.evaluate(READ)
  def prefs(page):return next(r['value'] for r in state(page)['meta'] if r['id']=='settings')
  def attach(context):
   context.add_init_script(MOCK)
   context.on('page',lambda page:page.on('pageerror',lambda e:errors.append(str(e))))
   context.on('request',lambda r:network.append(r.url) if not r.url.startswith(base) else None)
  def open_home(page):page.goto(base);expect(page.get_by_role('heading',name='Ready for a little adventure?')).to_be_visible();expect(page.get_by_role('button',name="Let's learn",exact=True).first).to_be_enabled(timeout=25000)
  def nav(page,label):page.get_by_role('button',name=label,exact=True).click()
  def wait_saved(page):page.wait_for_timeout(150)
  def submit(page,correct):
   session=state(page)['sessions'][0];q=session['questions'][session['index']]['question'];option=next(o for o in q['options'] if (o['id']==q['correctOptionId'])==correct);page.locator('[data-option-id="'+option['id']+'"]').click();page.wait_for_timeout(400)
  with sync_playwright() as p:
   executable=os.environ.get('CHROMIUM_PATH')
   launch={'headless':True,'args':['--no-sandbox']}
   if executable:launch['executable_path']=executable
   profile=temp/'profile';ctx=p.chromium.launch_persistent_context(str(profile),viewport={'width':1024,'height':900},**launch);attach(ctx);page=ctx.pages[0];page.on('pageerror',lambda e:errors.append(str(e)));page.add_init_script(MOCK)
   try:
    open_home(page);expect(page.locator('.lesson')).to_have_count(8);expect(page.get_by_role('button',name='Full lesson pending',exact=True)).to_have_count(2);ok('daily lesson catalog and explicit ambiguity gates')
    nav(page,'Parent & Settings');expect(page.locator('#device-voice option')).to_have_count(1);page.evaluate('(v)=>__setVoices(v)',VOICES);expect(page.locator('#device-voice option')).to_have_count(3);ok('dynamic delayed voice population')
    page.locator('#accent').select_option('en-GB');wait_saved(page);page.locator('#device-voice').select_option(label='Fixture US - en-US - on-device');wait_saved(page);page.locator('#settings-speed').select_option('0.75');wait_saved(page)
    before=state(page)['sessions'];page.locator('#test-voice').click();page.locator('#test-voice').click();assert state(page)['sessions']==before==[];assert page.evaluate('__speech.at(-1).rate')==0.75;ok('Test voice creates no sessions, attempts, listens or first-correct evidence')
    page.reload();expect(page.get_by_role('heading',name='Ready for a little adventure?')).to_be_visible();nav(page,'Parent & Settings');assert prefs(page)['voiceURI']=='fixture:us';assert prefs(page)['speed']==0.75;page.evaluate('(v)=>__setVoices(v)',VOICES[:1]);expect(page.locator('#voice-status')).to_contain_text('Using Fixture UK');assert prefs(page)['voiceURI']=='fixture:us';ok('voice persistence and unavailable saved-voice fallback')
    nav(page,'My lessons');expect(page.locator('.lesson').filter(has_text='PK1_4 - Weather Report_5').get_by_role('button',name="Let's learn",exact=True)).to_be_enabled(timeout=25000);page.locator('.lesson').filter(has_text='PK1_4 - Weather Report_5').get_by_role('button',name="Let's learn",exact=True).click();expect(page.locator('.answer')).to_have_count(4);expect(page.locator('#quiz-speed')).to_have_value('0.75');page.locator('#quiz-speed').select_option('1');wait_saved(page);nav(page,'Parent & Settings');expect(page.locator('#settings-speed')).to_have_value('1');before=state(page)['sessions'];page.locator('#test-voice').click();assert state(page)['sessions']==before;ok('quiz/settings speed synchronization and active-session test isolation')
    nav(page,'My lessons');page.get_by_role('button',name='Resume',exact=True).click();submit(page,False);submit(page,False);submit(page,True);s=state(page)['sessions'][0];assert len(s['questions'][0]['attempts'])==3;assert s['questions'][0]['firstCorrect']['attempts']==3;before=copy.deepcopy(s['questions'][0]);page.keyboard.press('Numpad1');assert state(page)['sessions'][0]['questions'][0]==before;ok('retry/first-correct integrity and repeated-answer suppression')
    page.get_by_role('button',name='Next word',exact=True).click();wait_saved(page);page.keyboard.press('Space');wait_saved(page);page.keyboard.press('Control');wait_saved(page);s=state(page)['sessions'][0];assert [e['kind'] for e in s['questions'][1]['support']]==['listen','hint'];submit(page,True);assert state(page)['sessions'][0]['questions'][1]['firstCorrect']['hints']==1;ok('Space Listen, Ctrl Hint, and supported first-correct snapshot')
    snapshot=state(page)['sessions'][0];page.reload();expect(page.get_by_role('button',name='Resume',exact=True)).to_be_enabled(timeout=25000);page.get_by_role('button',name='Resume',exact=True).click();wait_saved(page);assert state(page)['sessions'][0]['questions']==snapshot['questions'];ok('real IndexedDB reload preserves selected order and progress')
    # Two more solved targets then a durable round break.
    page.get_by_role('button',name='Next word',exact=True).click();submit(page,True);page.get_by_role('button',name='Next word',exact=True).click();submit(page,True);page.get_by_role('button',name='Next word',exact=True).click();wait_saved(page);assert state(page)['sessions'][0]['phase']=='break';assert state(page)['sessions'][0]['questions'][4]['seenAt'] is None;ok('four-question break does not mark future words as seen')
    nav(page,'Parent & Settings');other=ctx.new_page();open_text='Ready for a little adventure?';other.goto(base);expect(other.get_by_role('heading',name=open_text)).to_be_visible();expect(other.get_by_role('button',name="Let's learn",exact=True).first).to_be_disabled();expect(other.locator('#storage-status')).to_contain_text('Read-only');other.close();ok('second tab is read-only instead of overwriting history')
    # Illustration approvals have their own identity and no learning side effects.
    before=state(page)['sessions'];card=page.locator('.image-card').filter(has=page.get_by_role('heading',name='Apple',exact=True));
    if card.count()==0:
     page.locator('#image-search').fill('apple');page.locator('#image-search').dispatch_event('change');card=page.locator('.image-card').filter(has=page.get_by_role('heading',name='Apple',exact=True))
    card.get_by_role('button',name='Approve',exact=True).click();wait_saved(page);assert state(page)['sessions']==before;card.get_by_role('button',name='Reject',exact=True).click();wait_saved(page);assert state(page)['sessions']==before;ok('image review has no learning-history side effects')
    # Device-local backup is full, not filtered, and round-trips atomically.
    with page.expect_download() as d:page.get_by_role('button',name='Back up all history',exact=True).click()
    backup_path=temp/'backup.json';d.value.save_as(backup_path);backup=json.loads(backup_path.read_text());assert backup['sessions'][0]['phase']=='break';assert backup['sessions'][0]['paused'];ok('full backup includes unfinished session and round state')
    browser=p.chromium.launch(**launch);fresh=browser.new_context();attach(fresh);restore=fresh.new_page();open_home(restore);nav(restore,'Parent & Settings');restore.on('dialog',lambda d:d.accept());restore.locator('#restore-file').set_input_files(str(backup_path));expect(restore.locator('#toast')).to_contain_text('Restored 1 sessions');restore.locator('#restore-file').set_input_files(str(backup_path));expect(restore.locator('#toast')).to_contain_text('1 identical');assert len(state(restore)['sessions'])==1
    conflict=copy.deepcopy(backup);new=copy.deepcopy(conflict['sessions'][0]);new['id']='extra-fixture';conflict['sessions'][0]['activeMs']+=1;conflict['sessions'].insert(0,new);bad=temp/'conflict.json';bad.write_text(json.dumps(conflict));restore.locator('#restore-file').set_input_files(str(bad));expect(restore.locator('#toast')).to_contain_text('Conflicting session');assert len(state(restore)['sessions'])==1;fresh.close();browser.close();ok('real atomic restore: idempotent import and conflict prevents partial writes')
    # Scope/layout checks; the stored history is real but speech remains a fixture.
    screenshots=Path(report).parent/'screenshots';screenshots.mkdir(parents=True,exist_ok=True)
    for label in ['My lessons','Quick review','Learning History','Parent & Settings']:
     nav(page,label)
     for width,height in [(360,800),(390,844),(768,1024),(1024,768)]:
      page.set_viewport_size({'width':width,'height':height});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(label,width)
     page.screenshot(path=str(screenshots/(label.replace(' ','-')+'.png')),full_page=True)
    ok('four mobile/tablet widths: home, review, history, settings and image gallery')
    expect(page.locator('#offline-label')).to_contain_text('offline ready',timeout=30000);assert page.evaluate('navigator.serviceWorker.controller!==null');assert page.evaluate('caches.keys()').__len__()>0;ok('real service worker install, CacheStorage and content readiness')
    awaitable=page.evaluate("async()=>{await caches.open('unrelated-app-fixture');}")
    ctx.close();ctx=p.chromium.launch_persistent_context(str(profile),viewport={'width':390,'height':844},**launch);attach(ctx);ctx.set_offline(True);page=ctx.pages[0];page.add_init_script(MOCK);open_home(page);expect(page.get_by_role('button',name='Resume',exact=True)).to_be_enabled(timeout=25000);assert len(state(page)['sessions'])==1;assert prefs(page)['speed']==1;assert 'unrelated-app-fixture' in page.evaluate('caches.keys()');ok('complete browser close and offline reopen preserve history/settings and other app caches')
    page.get_by_role('button',name='Resume',exact=True).click();wait_saved(page);assert state(page)['sessions'][0]['phase']=='break';page.get_by_role('button',name='Continue',exact=False).click();wait_saved(page);page.get_by_role('button',name='Skip for now',exact=True).click();submit(page,True);page.get_by_role('button',name='Next word',exact=True).click();submit(page,True);page.get_by_role('button',name='See my result',exact=True).click();expect(page.get_by_role('heading',name='You did it!')).to_be_visible();assert state(page)['sessions'][0]['questions'][4]['skippedAt'];ok('offline finish preserves skipped result and exposes replay')
    ctx.close();Handler.corrupt=True;broken=p.chromium.launch_persistent_context(str(temp/'broken'),**launch);attach(broken);badpage=broken.pages[0];badpage.add_init_script(MOCK);open_home(badpage);badpage.wait_for_timeout(4000);assert failure_requests;assert not badpage.evaluate("async()=>{for(const key of await caches.keys()){const c=await caches.open(key);if((await c.keys()).some(r=>r.url.endsWith('__offline_ready__')))return true;}return false;}");broken.close();ok('failed required offline download leaves no false readiness marker')
    assert not errors,errors;assert not network,network;ok('no uncaught page errors or external app requests')
   finally:
    try:ctx.close()
    except Exception:pass
    server.shutdown()
 result={'status':'PASS','checks':checks,'browser':'Chromium real-origin disposable profile','speech':'Synthetic device voices; no audible/physical device claims','remaining':['Physical Safari/iPadOS and iPhone installation','Android installation','Audible offline TTS with actual downloaded device voices']};Path(report).parent.mkdir(parents=True,exist_ok=True);Path(report).write_text(json.dumps(result,indent=2));return result
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--report',default='test-results/browser.json');args=parser.parse_args()
 try:run(args.report)
 except Exception as exc:
  Path(args.report).parent.mkdir(parents=True,exist_ok=True);Path(args.report).write_text(json.dumps({'status':'FAIL','error':str(exc)},indent=2));raise
