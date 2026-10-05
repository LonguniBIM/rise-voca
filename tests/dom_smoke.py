"""Offline DOM smoke tests; not a substitute for tests/browser.py.
No localhost or network navigation. Fetch, UUID and speech are fixtures;
storage intentionally falls back to temporary memory on about:blank.
"""
import argparse,json,re,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
def run(output):
 output=Path(output);output.mkdir(parents=True,exist_ok=True);root=ROOT/'dist';checks=[];errors=[]
 def ok(name):checks.append(name);print('PASS',name,flush=True)
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=shutil.which('chromium') or p.chromium.executable_path,headless=True,args=['--no-sandbox']);page=browser.new_page(viewport={'width':1024,'height':850});page.set_default_timeout(5000);page.on('pageerror',lambda e:errors.append(str(e)))
  html=(root/'index.html').read_text();html=re.sub(r'<link[^>]+>','',html);html=re.sub(r'<script[^>]+>.*?</script>','',html,flags=re.S);html=html.replace('</head>','<style>'+(root/'src/styles.css').read_text()+(root/'src/lesson-stimuli.css').read_text()+'</style></head>');page.set_content(html)
  data={name:json.loads((root/name.removeprefix('./')).read_text()) for name in ['./data/library.json','./data/illustrations.json','./BUILD_INFO.json','./data/weeks/index.json']}
  page.evaluate('(data)=>{window.fetch=async path=>new Response(JSON.stringify(data[path]),{headers:{"Content-Type":"application/json"}});}',data)
  page.evaluate('let fixtureId=0;crypto.randomUUID=()=>"dom-fixture-"+(++fixtureId);')
  page.evaluate('''() => {let voices=[];window.__speech=[];const s=new EventTarget();s.getVoices=()=>voices;s.cancel=()=>{};s.speak=u=>__speech.push({text:u.text,rate:u.rate,name:u.voice?.name});Object.defineProperty(window,'speechSynthesis',{value:s});Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class{constructor(text){this.text=text;}}});window.__voices=v=>{voices=v;s.dispatchEvent(new Event('voiceschanged'));};}''')
  for name,key in [('core','RVCore'),('speech','RVSpeech'),('store','RVStore'),('auto-read','RVAuto')]:
   text=(root/('src/'+name+'.js')).read_text();exports=re.findall(r'export (?:function|class|const) (\w+)',text);text=re.sub(r"import \{([^}]+)\} from './core.js';",r'const {\1}=RVCore;',text);text=re.sub(r"import \{([^}]+)\} from './speech.js';",r'const {\1}=RVSpeech;',text);text=re.sub(r'\bexport ','',text);page.evaluate('globalThis.'+key+'=(()=>{'+text+';return {'+','.join(exports)+'};})()')
  text=(root/'src/app.js').read_text().replace("import * as D from './core.js';","const D=RVCore;").replace("import {Store} from './store.js';","const {Store}=RVStore;").replace("import {AutomaticClueReader} from './auto-read.js';","const {AutomaticClueReader}=RVAuto;").replace("import {ACCENTS,SPEEDS,SpeechController,exactVoice,speechPreferences} from './speech.js';","const {ACCENTS,SPEEDS,SpeechController,exactVoice,speechPreferences}=RVSpeech;")
  # Inspection is appended only to this in-memory test copy, never to production.
  page.evaluate('(()=>{'+text+';window.__inspect=()=>D.clone({current,sessions,prefs,reviews});})()')
  expect(page.get_by_role('heading',name='Ready for a little adventure?')).to_be_visible();expect(page.locator('.lesson')).to_have_count(25);expect(page.get_by_role('button',name='Full lesson pending',exact=True)).to_have_count(4);ok('twenty-five lesson cards; four explicit source-ambiguity gates')
  def nav(label):page.get_by_role('button',name=label,exact=True).click();page.wait_for_timeout(60)
  def inspect():return page.evaluate('__inspect()')
  nav('Parent & Settings');expect(page.locator('#auto-read-clue')).to_be_checked();page.locator('#auto-read-clue').uncheck();page.wait_for_timeout(50);expect(page.locator('#device-voice option')).to_have_count(1);voices=[{'name':'Fixture UK','voiceURI':'fixture:gb','lang':'en-GB','localService':True},{'name':'Fixture US','voiceURI':'fixture:us','lang':'en-US','localService':True}];page.evaluate('(v)=>__voices(v)',voices);expect(page.locator('#device-voice option')).to_have_count(3);page.locator('#accent').select_option('en-GB');page.wait_for_timeout(50);page.locator('#device-voice').select_option(label='Fixture US - en-US - on-device');page.wait_for_timeout(50);page.locator('#settings-speed').select_option('0.75');page.wait_for_timeout(50);page.locator('#test-voice').click();assert inspect()['sessions']==[];assert page.evaluate('__speech.at(-1).rate')==0.75;ok('dynamic voice settings and Test voice without any session')
  page.evaluate('(v)=>__voices(v)',voices[:1]);expect(page.locator('#voice-status')).to_contain_text('Using Fixture UK');assert inspect()['prefs']['voiceURI']=='fixture:us';ok('saved voice disappears: preferred-accent fallback retains preference')
  nav('My lessons');page.locator('.lesson').filter(has_text='PK1_4 - Weather Report_5').get_by_role('button',name="Let's learn",exact=True).click();expect(page.locator('.answer')).to_have_count(4);expect(page.locator('#quiz-speed')).to_have_value('0.75');page.locator('#quiz-speed').select_option('1');page.wait_for_timeout(50);nav('Parent & Settings');expect(page.locator('#settings-speed')).to_have_value('1');before=inspect()['sessions'];page.locator('#test-voice').click();assert inspect()['sessions']==before;ok('speed synchronization and paused-session Test voice isolation')
  nav('My lessons');page.get_by_role('button',name='Resume',exact=True).click();page.wait_for_timeout(50)
  def answer(correct):
   state=inspect()['current'];q=state['questions'][state['index']]['question'];option=next(o for o in q['options'] if (o['id']==q['correctOptionId'])==correct);page.locator('[data-option-id="'+option['id']+'"]').click();page.wait_for_timeout(370)
  answer(False);answer(False);answer(True);q=inspect()['current']['questions'][0];assert len(q['attempts'])==3 and q['firstCorrect']['attempts']==3;before=inspect()['current']['questions'][0];page.keyboard.press('Numpad1');assert inspect()['current']['questions'][0]==before;ok('two wrong, one correct; repeat answer cannot duplicate first correct')
  page.get_by_role('button',name='Next word',exact=True).click();page.wait_for_timeout(80);page.keyboard.press('Space');page.wait_for_timeout(80);page.keyboard.press('Control');page.wait_for_timeout(80);q=inspect()['current']['questions'][1];assert [e['kind'] for e in q['support']]==['listen','hint'];answer(True);assert inspect()['current']['questions'][1]['firstCorrect']['hints']==1;ok('numeric/Space/Ctrl keyboard flow and hint support')
  for _ in range(2):page.get_by_role('button',name='Next word',exact=True).click();answer(True)
  page.get_by_role('button',name='Next word',exact=True).click();page.wait_for_timeout(80);assert inspect()['current']['phase']=='break';assert inspect()['current']['questions'][4]['seenAt'] is None;page.get_by_role('button',name='Continue to round 2',exact=True).click();page.wait_for_timeout(80);page.get_by_role('button',name='Skip for now',exact=True).click();page.wait_for_timeout(80);answer(True);page.get_by_role('button',name='Next word',exact=True).click();answer(True);page.get_by_role('button',name='See my result',exact=True).click();expect(page.get_by_role('heading',name='You did it!')).to_be_visible();assert inspect()['current']['questions'][4]['skippedAt'];assert len(inspect()['sessions'])==1;ok('round, continue, skip and full finish preserve evidence')
  page.get_by_role('button',name='Play again',exact=True).click();expect(page.locator('.answer')).to_have_count(4);assert len(inspect()['sessions'])==2;ok('replay creates a fresh session while retaining completed history')
  # Quiz and all parent/report surfaces at the requested responsive widths.
  for width,height in [(360,800),(390,844),(768,1024),(1024,768)]:
   page.set_viewport_size({'width':width,'height':height});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert page.locator('.answer').evaluate_all('(els)=>els.every(e=>e.getBoundingClientRect().height>=44)')
  page.screenshot(path=str(output/'quiz-tablet.png'),full_page=True);ok('quiz touch targets and no overflow at four widths')
  nav('Parent & Settings');before=inspect()['sessions'];card=page.locator('.image-card').filter(has=page.get_by_role('heading',name='Apple',exact=True));card.get_by_role('button',name='Approve',exact=True).click();page.wait_for_timeout(60);card.get_by_role('button',name='Reject',exact=True).click();page.wait_for_timeout(60);assert inspect()['sessions']==before;assert any(r['decision']=='rejected' for r in inspect()['reviews'].values());ok('image approval/rejection is separate from learning history')
  for label in ['My lessons','Quick review','Learning History','Parent & Settings']:
   nav(label)
   for width,height in [(360,800),(390,844),(768,1024),(1024,768)]:page.set_viewport_size({'width':width,'height':height});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(label,width)
   page.screenshot(path=str(output/(label.replace(' ','-')+'.png')),full_page=True)
  page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(output/'voice-settings-phone.png'),full_page=False);ok('home/review/history/settings/gallery layouts at four widths')
  nav('Learning History');page.get_by_role('button',name='By word / item',exact=True).click();expect(page.get_by_text('Cloudy',exact=False).first).to_be_visible();page.get_by_role('button',name='By topic',exact=True).click();expect(page.locator('table')).to_have_count(1);ok('history aggregate views render from actual in-memory sessions')
  assert not errors,errors;ok('no uncaught page errors during DOM smoke');browser.close()
 report={'status':'PASS','testType':'DOM-only: about:blank, mocked fetch/UUID/TTS, temporary-memory storage','checks':checks,'count':len(checks),'notTested':['Real IndexedDB and persistence after process close','Real-origin service worker/CacheStorage/offline reopen','GitHub Pages deployment','Physical tablet/phone installation and audible speech']};(output/'dom-report.json').write_text(json.dumps(report,indent=2));return report
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--output',default='test-results/dom');run(a.parse_args().output)
