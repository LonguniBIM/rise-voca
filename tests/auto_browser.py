"""Real-origin automatic-clue and expanded-catalog integration checks; synthetic voices only."""
import argparse, functools, http.server, json, os, tempfile, threading
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from browser import ROOT, MOCK, READ, VOICES

def run(report):
 checks=[];errors=[]
 def ok(label):checks.append(label);print('PASS',label,flush=True)
 class Handler(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*args):pass
 with tempfile.TemporaryDirectory(prefix='rise-auto-') as folder:
  root=Path(folder);(root/'rise-voca').symlink_to(ROOT/'dist',target_is_directory=True)
  server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
  url=f'http://127.0.0.1:{server.server_port}/rise-voca/'
  with sync_playwright() as p:
   launch={'headless':True,'args':['--no-sandbox']}
   if os.getenv('CHROMIUM_PATH'):launch['executable_path']=os.environ['CHROMIUM_PATH']
   browser=p.chromium.launch(**launch);ctx=browser.new_context(viewport={'width':390,'height':844});ctx.add_init_script(MOCK);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
   def state():return page.evaluate(READ)
   def settle():page.wait_for_timeout(400)
   def nav(name):page.get_by_role('button',name=name,exact=True).click();settle()
   def play(name):page.locator('.lesson').filter(has=page.get_by_text(name,exact=True)).get_by_role('button',name="Let's learn",exact=True).click();settle()
   def session():return next(s for s in state()['sessions'] if s['lessonNames']==['PK1_4 - Weather Report_5'])
   try:
    page.goto(url);expect(page.locator('.lesson')).to_have_count(len(json.loads((ROOT/'dist/data/library.json').read_text())['lessons']))
    nav('Parent & Settings');expect(page.locator('#auto-read-clue')).to_be_checked();page.evaluate('(v)=>__setVoices(v)',VOICES)
    page.locator('#test-voice').click();settle();assert state()['sessions']==[];ok('default checked and Test voice never creates a learning session')
    nav('My lessons');page.evaluate('window.__speech=[]');play('PK1_4 - Weather Report_5')
    q=session()['questions'][0];assert page.evaluate('__speech.map(x=>x.text)')==[q['question']['question']];assert len(q['support'])==1 and q['support'][0]['trigger']=='automatic';assert not q['attempts'] and q['firstCorrect'] is None;ok('first displayed clue is automatically requested and labelled, with no answer or score')
    page.evaluate('(v)=>__setVoices(v)',VOICES);page.locator('#quiz-speed').select_option('0.75');settle()
    wrong=next(o['id'] for o in q['question']['options'] if o['id']!=q['question']['correctOptionId']);page.locator('[data-option-id="'+wrong+'"]').click();settle();page.get_by_role('button',name='Show a hint',exact=True).click();settle();assert page.evaluate('__speech.length')==1;ok('voice refresh, speed changes, retries and hint re-renders do not replay the clue')
    page.locator('#listen').click();settle();assert [e.get('trigger') for e in session()['questions'][0]['support'] if e['kind']=='listen']==['automatic','manual'];ok('manual Listen remains usable and is distinguished from automatic playback')
    page.locator('[data-option-id="'+q['question']['correctOptionId']+'"]').click();settle();page.get_by_role('button',name='Next word',exact=True).click();settle();assert session()['questions'][1]['support'][0]['trigger']=='automatic';ok('next question automatically reads once without altering first-correct evidence')
    snapshot=session()['questions'];page.reload();expect(page.get_by_role('button',name='Resume',exact=True)).to_be_enabled(timeout=25000);page.get_by_role('button',name='Resume',exact=True).click();settle();assert session()['questions']==snapshot;assert page.evaluate('__speech.length')==0;ok('reload/resume does not duplicate stored automatic-listen requests')
    nav('Parent & Settings');before=state()['sessions'];page.locator('#test-voice').click();settle();assert state()['sessions']==before
    page.locator('#auto-read-clue').uncheck();settle();page.reload();expect(page.get_by_role('heading',name='Ready for a little adventure?')).to_be_visible();nav('Parent & Settings');expect(page.locator('#auto-read-clue')).not_to_be_checked();ok('explicit off persists through reload and Test voice leaves existing history unchanged')
    nav('My lessons');expect(page.locator('.lesson').filter(has=page.get_by_text('PK1_2 - Ant Disaster_1',exact=True)).get_by_role('button',name="Let's learn",exact=True)).to_be_enabled(timeout=25000);page.evaluate('__speech=[]');play('PK1_2 - Ant Disaster_1');assert page.evaluate('__speech.length')==0;expect(page.locator('.scene-main')).to_have_text('1');expect(page.locator('.answer')).to_have_count(4);page.locator('#listen').click();settle();assert page.evaluate('__speech.length')==1;ok('disabled automatic mode stays silent and number lessons retain explicit Listen')
    nav('My lessons');play('PK1_3 - Edmo the Wizard_1');expect(page.locator('.colour-patch')).to_have_count(1);assert page.locator('.colour-patch').evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(229, 57, 53)'
    for w,h in [(360,800),(390,844),(768,1024),(1024,768)]:
     page.set_viewport_size({'width':w,'height':h});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    ok('colour patch and four choices render without overflow at four phone/tablet sizes')
    nav('Parent & Settings');page.set_viewport_size({'width':390,'height':844});out=Path(report).parent;out.mkdir(parents=True,exist_ok=True);page.screenshot(path=str(out/'auto-voice-phone.png'),full_page=True);assert not errors,errors;ok('no uncaught browser errors')
   finally:ctx.close();browser.close();server.shutdown()
 result={'status':'PASS','checks':checks,'scope':'Chromium, real IndexedDB, synthetic voices; not physical Safari/Android audio'};Path(report).write_text(json.dumps(result,indent=2));return result
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--report',default='test-results/automatic-clues.json');args=parser.parse_args();run(args.report)
