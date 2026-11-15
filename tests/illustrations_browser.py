"""Real-origin SVG review, lesson and offline checks using disposable profiles.

Uses fixture voices only; does not establish audible speech or physical-device use.
Run against an already-built dist with: python tests/illustrations_browser.py
"""
import argparse
import functools
import http.server
import json
import os
import tempfile
import threading
import time
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright
from browser import MOCK, READ, ROOT, VOICES


LESSONS = [
    {'id': 'pk2-2606-t5-l5', 'name': 'PK2_5 - Toy Factory_5', 'count': 9},
    {'id': 'pk2-2606-t5-l6', 'name': 'PK2_5 - Toy Factory_6', 'count': 19},
]
INSTALL_STATES = """(() => {
  window.__illustrationInstallStates = [];
  const register = navigator.serviceWorker.register.bind(navigator.serviceWorker);
  const observe = worker => {
    if (!worker) return;
    const record = () => window.__illustrationInstallStates.push(worker.state);
    record();
    worker.addEventListener('statechange', record);
  };
  navigator.serviceWorker.register = (...args) => register(...args).then(reg => {
    observe(reg.installing);
    reg.addEventListener('updatefound', () => observe(reg.installing));
    return reg;
  });
})()"""
HAS_READY_MARKER = """async () => {
  for (const name of await caches.keys()) {
    const cache = await caches.open(name);
    if ((await cache.keys()).some(r => r.url.endsWith('__offline_ready__'))) return true;
  }
  return false;
}"""


def run(report):
    report = Path(report)
    report.parent.mkdir(parents=True, exist_ok=True)
    checks, errors, external_requests, fault_requests = [], [], [], []

    def ok(name):
        checks.append({'name': name, 'status': 'PASS'})
        print('PASS', name, flush=True)

    def state(page):
        return page.evaluate(READ)

    def meta(snapshot, key):
        return next((r['value'] for r in snapshot['meta'] if r['id'] == key), {})

    def saved(page, predicate, description):
        deadline = time.monotonic() + 8
        while time.monotonic() < deadline:
            snapshot = state(page)
            if predicate(snapshot):
                return snapshot
            page.wait_for_timeout(50)
        raise AssertionError('Timed out waiting for ' + description)

    def session(snapshot, lesson):
        matches = [s for s in snapshot['sessions'] if s['lessonIds'] == [lesson['id']]]
        assert len(matches) == 1, (lesson['id'], len(matches))
        return matches[0]

    def nav(page, label):
        page.get_by_role('button', name=label, exact=True).click()

    def no_overflow(page, label):
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), label

    def loaded_images(container, record, base):
        assets = [record, *record.get('additionalAssets', [])]
        images = container.locator('img.scene-image')
        expect(images).to_have_count(len(assets))
        for index, asset in enumerate(assets):
            image = images.nth(index)
            expect(image).to_be_visible()
            expect(image).to_have_js_property('complete', True, timeout=15000)
            size = image.evaluate('(e) => ({width:e.naturalWidth,height:e.naturalHeight,src:e.src})')
            assert size['width'] > 0 and size['height'] > 0, (record['itemId'], size)
            assert size['src'] == base + asset['assetPath'], size

    try:
        library = json.loads((ROOT / 'dist/data/library.json').read_text())
        registry = json.loads((ROOT / 'dist/data/illustrations.json').read_text())
        build = json.loads((ROOT / 'dist/BUILD_INFO.json').read_text())
        manifest = json.loads((ROOT / 'dist/offline-manifest.json').read_text())
        items = {item['id']: item for item in library['items']}
        pictures = [r for r in registry['records'] if r['kind'] == 'svg']
        assert pictures, 'The built catalog has no SVG candidates'
        assert all(r['status'] == 'needs-review' for r in pictures)
        by_item = {r['itemId']: r for r in pictures}
        head, jump = by_item['head'], by_item['jump']
        asset_paths = {a['assetPath'] for r in pictures for a in [r, *r.get('additionalAssets', [])]}
        assert asset_paths <= {entry['path'] for entry in manifest['files']}, 'SVG missing from offline pack'

        class Handler(http.server.SimpleHTTPRequestHandler):
            svg_fault = None

            def log_message(self, *_args):
                pass

            def end_headers(self):
                # Fault profiles must fetch the bytes again after a browser restart.
                # The real service worker still explicitly stores its verified responses.
                if urlsplit(self.path).path.endswith('.svg'):
                    self.send_header('Cache-Control', 'no-store')
                super().end_headers()

            def do_GET(self):
                path = urlsplit(self.path).path
                if self.svg_fault and path == '/rise-voca/' + head['assetPath']:
                    fault_requests.append({'mode': self.svg_fault, 'path': path})
                    body = (b'not an SVG image' if self.svg_fault == 'decode-error' else
                            b'<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2">'
                            b'<rect width="2" height="2" fill="red"/></svg>')
                    self.send_response(200)
                    self.send_header('Content-Type', 'image/svg+xml')
                    self.send_header('Content-Length', str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)
                    return
                super().do_GET()

        with tempfile.TemporaryDirectory(prefix='rise-illustrations-') as folder:
            temporary = Path(folder)
            (temporary / 'rise-voca').symlink_to(ROOT / 'dist', target_is_directory=True)
            server = http.server.ThreadingHTTPServer(
                ('127.0.0.1', 0), functools.partial(Handler, directory=str(temporary)))
            threading.Thread(target=server.serve_forever, daemon=True).start()
            base = f'http://127.0.0.1:{server.server_port}/rise-voca/'

            def attach(context):
                context.add_init_script(MOCK)
                context.on('page', lambda p: p.on('pageerror', lambda e: errors.append(str(e))))
                for page in context.pages:
                    page.on('pageerror', lambda e: errors.append(str(e)))
                context.on('request', lambda r: external_requests.append(r.url)
                           if urlsplit(r.url).scheme in ('http', 'https')
                           and urlsplit(r.url).netloc != urlsplit(base).netloc else None)

            def open_home(page):
                page.goto(base)
                expect(page.get_by_role('heading', name='Ready for a little adventure?', exact=True)).to_be_visible()
                expect(page.get_by_role('button', name="Let's learn", exact=True).first).to_be_enabled(timeout=25000)
                page.evaluate('(voices) => __setVoices(voices)', VOICES)

            def quiet_settings(page):
                nav(page, 'Parent & Settings')
                page.locator('#auto-read-clue').uncheck()
                saved(page, lambda s: meta(s, 'settings').get('autoReadClue') is False, 'saved voice setting')
                expect(page.get_by_role('heading', name='Review illustrations', exact=True)).to_be_visible()

            def gallery_card(page, record):
                word = items[record['itemId']]['word']
                search = page.locator('#image-search')
                search.fill(word)
                search.dispatch_event('change')
                gallery = page.locator('#illustration-review')
                card = gallery.locator('.image-card').filter(
                    has=page.get_by_role('heading', name=word, exact=True))
                # Short words can match more than one page of meanings.
                for _ in range((len(registry['records']) + 11) // 12):
                    if card.count():
                        break
                    next_page = gallery.get_by_role('button', name='Next', exact=True)
                    if not next_page.is_enabled():
                        break
                    label = gallery.locator('.pagination .help')
                    previous = label.inner_text()
                    next_page.click()
                    expect(label).not_to_have_text(previous)
                expect(card).to_have_count(1)
                return card

            def review(page, record, decision):
                card = gallery_card(page, record)
                card.get_by_role('button', name='Approve' if decision == 'approved' else 'Reject', exact=True).click()
                key = record['itemId'] + '|' + record['identity']
                saved(page, lambda s: meta(s, 'image-reviews').get(key, {}).get('decision') == decision,
                      record['itemId'] + ' review')
                expect(card.locator('.tag')).to_have_text(decision)
                expect(page.locator('#image-search')).to_have_value(items[record['itemId']]['word'])

            def play(page, lesson):
                card = page.locator('.lesson').filter(has=page.get_by_text(lesson['name'], exact=True))
                expect(card.locator('.tag.green')).to_have_text(str(lesson['count']) + ' learning targets')
                card.locator('summary').click()
                expect(card).to_contain_text('Original class: PK2_2606')
                expect(card.locator('.vocab-list span')).to_have_count(lesson['count'])
                card.get_by_role('button', name="Let's learn", exact=True).click()
                expect(page.locator('.answer')).to_have_count(4)
                current = session(state(page), lesson)
                assert len(current['questions']) == lesson['count']
                assert all(len(q['question']['options']) == 4 for q in current['questions'])
                return current

            def resume(page, lesson):
                row = page.locator('.row.between').filter(has_text=lesson['name'] + ' - ')
                expect(row.get_by_role('button', name='Resume', exact=True)).to_be_enabled(timeout=25000)
                row.get_by_role('button', name='Resume', exact=True).click()
                expect(page.locator('.answer')).to_have_count(4)

            def pause(page):
                nav(page, 'Save & pause')
                expect(page.get_by_role('heading', name='Ready for a little adventure?', exact=True)).to_be_visible()

            def fallback(page, clue):
                expect(page.locator('.quiz-shell .scene-note')).to_contain_text('Listen to the clue.')
                expect(page.locator('.quiz-shell img.scene-image')).to_have_count(0)
                expect(page.locator('#question-text')).to_have_text(clue)
                expect(page.locator('.answer')).to_have_count(4)
                expect(page.locator('#listen')).to_be_enabled()

            context, page = None, None
            try:
                with sync_playwright() as playwright:
                    launch = {'headless': True, 'args': ['--no-sandbox']}
                    if os.getenv('CHROMIUM_PATH'):
                        launch['executable_path'] = os.environ['CHROMIUM_PATH']

                    def profile(name, **options):
                        ctx = playwright.chromium.launch_persistent_context(
                            str(temporary / name), viewport={'width': 390, 'height': 844}, **launch, **options)
                        attach(ctx)
                        return ctx

                    try:
                        context = profile('reviewed')
                        page = context.pages[0]
                        open_home(page)
                        quiet_settings(page)
                        for record in pictures:
                            card = gallery_card(page, record)
                            expect(card.locator('.tag')).to_have_text('needs-review')
                            loaded_images(card, record, base)
                            expect(card.get_by_role('button', name='Approve', exact=True)).to_be_enabled()
                            expect(card).to_contain_text(record['attribution'])
                            links = card.locator('a').evaluate_all('(links) => links.map(a => a.href)')
                            for asset in [record, *record.get('additionalAssets', [])]:
                                assert asset['sourceUrl'] in links and asset['licenseUrl'] in links
                            no_overflow(page, 'gallery: ' + record['itemId'])
                        assert state(page)['sessions'] == []
                        ok(f'all {len(pictures)} SVG previews decode, expose credits and create no learning history')

                        nav(page, 'My lessons')
                        play(page, LESSONS[0])
                        current = session(state(page), LESSONS[0])
                        jump_index = next(i for i, q in enumerate(current['questions'])
                                          if q['question']['itemId'] == 'jump')
                        for index in range(jump_index):
                            nav(page, 'Skip for now')
                            advanced = saved(page, lambda s: session(s, LESSONS[0])['index'] == index + 1,
                                             'next L5 target')
                            current = session(advanced, LESSONS[0])
                            if current['phase'] == 'break':
                                page.get_by_role('button', name='Continue to round ', exact=False).click()
                            expect(page.locator('#question-text')).to_have_text(
                                current['questions'][index + 1]['question']['question'])
                            expect(page.locator('.answer')).to_have_count(4)
                        fallback(page, items['jump']['question']['question'])
                        pause(page)
                        current = play(page, LESSONS[1])
                        assert current['questions'][0]['question']['itemId'] == 'head'
                        fallback(page, items['head']['question']['question'])
                        head_question = current['questions'][0]
                        ok('new PK2_2606 lessons keep 9/19 targets, four choices and unapproved context clues')

                        nav(page, 'Parent & Settings')
                        expect(page.locator('#illustration-review')).to_be_visible()
                        before_review = state(page)['sessions']
                        review(page, head, 'approved')
                        review(page, jump, 'rejected')
                        assert state(page)['sessions'] == before_review
                        card = gallery_card(page, head)
                        loaded_images(card, head, base)
                        for width, height in [(360, 800), (390, 844), (768, 1024), (1024, 768)]:
                            page.set_viewport_size({'width': width, 'height': height})
                            no_overflow(page, ('gallery', width))
                        page.set_viewport_size({'width': 390, 'height': 844})
                        page.locator('#illustration-review').screenshot(path=str(report.parent / 'illustrations-gallery-phone.png'))
                        ok('approve/reject preserves the search and leaves existing session evidence unchanged')

                        nav(page, 'My lessons')
                        resume(page, LESSONS[1])
                        loaded_images(page.locator('.quiz-shell'), head, base)
                        expect(page.locator('.quiz-shell .scene-note')).to_have_count(0)
                        expect(page.locator('#question-text')).to_have_text(items['head']['question']['question'])
                        assert session(state(page), LESSONS[1])['questions'][0] == head_question
                        for width, height in [(360, 800), (390, 844), (768, 1024), (1024, 768)]:
                            page.set_viewport_size({'width': width, 'height': height})
                            no_overflow(page, ('approved SVG quiz', width))
                            expect(page.locator('.answer')).to_have_count(4)
                            if width in (390, 768):
                                suffix = 'phone' if width == 390 else 'tablet'
                                page.locator('.quiz-shell').screenshot(path=str(report.parent / ('illustrations-lesson-' + suffix + '.png')))
                        ok('approval replaces the active question fallback with a decoded SVG at phone/tablet sizes')

                        correct = head_question['question']['correctOptionId']
                        page.locator('[data-option-id=' + json.dumps(correct) + ']').click()
                        saved(page, lambda s: session(s, LESSONS[1])['questions'][0]['firstCorrect'] is not None,
                              'real correct-answer evidence')
                        expect(page.locator('.feedback.success')).to_be_visible()
                        pause(page)
                        expect(page.locator('#offline-label')).to_contain_text('offline ready', timeout=45000)
                        assert page.evaluate('navigator.serviceWorker.controller !== null')
                        assert page.evaluate(HAS_READY_MARKER)
                        before_close = state(page)
                        context.close()
                        context = profile('reviewed')
                        context.set_offline(True)
                        page = context.pages[0]
                        open_home(page)
                        reopened = state(page)
                        assert reopened['sessions'] == before_close['sessions']
                        assert meta(reopened, 'image-reviews') == meta(before_close, 'image-reviews')
                        nav(page, 'Parent & Settings')
                        for record, decision in [(head, 'approved'), (jump, 'rejected')]:
                            card = gallery_card(page, record)
                            expect(card.locator('.tag')).to_have_text(decision)
                            loaded_images(card, record, base)
                        nav(page, 'My lessons')
                        resume(page, LESSONS[0])
                        fallback(page, items['jump']['question']['question'])
                        pause(page)
                        resume(page, LESSONS[1])
                        loaded_images(page.locator('.quiz-shell'), head, base)
                        assert session(state(page), LESSONS[1])['questions'] == session(before_close, LESSONS[1])['questions']
                        ok('browser close and offline reopen retain SVG decisions, decoded pictures and first-correct history')
                        context.close()

                        # A distinct profile without a worker isolates a real SVG decode failure
                        # from the previously verified offline cache; source files stay untouched.
                        context = profile('decode-error', service_workers='block')
                        page = context.pages[0]
                        open_home(page)
                        quiet_settings(page)
                        review(page, head, 'approved')
                        before_failure = state(page)
                        assert before_failure['sessions'] == []
                        context.close()
                        Handler.svg_fault = 'decode-error'
                        context = profile('decode-error', service_workers='block')
                        page = context.pages[0]
                        open_home(page)
                        quiet_settings(page)
                        card = gallery_card(page, head)
                        expect(card.locator('.scene-note')).to_contain_text('Picture is unavailable.')
                        expect(card.locator('img.scene-image')).to_have_count(0)
                        expect(card.get_by_role('button', name='Approve', exact=True)).to_be_disabled()
                        after_failure = state(page)
                        assert after_failure['sessions'] == before_failure['sessions']
                        assert meta(after_failure, 'image-reviews') == meta(before_failure, 'image-reviews')
                        nav(page, 'My lessons')
                        play(page, LESSONS[1])
                        fallback(page, items['head']['question']['question'])
                        assert any(r['mode'] == 'decode-error' for r in fault_requests)
                        page.locator('#listen').click()
                        saved(page, lambda s: any(e['kind'] == 'listen' for e in
                              session(s, LESSONS[1])['questions'][0]['support']), 'fallback Listen request')
                        assert page.evaluate('__speech.at(-1).text') == items['head']['question']['question']
                        question = session(state(page), LESSONS[1])['questions'][0]
                        assert question['attempts'] == [] and question['firstCorrect'] is None
                        ok('a broken SVG disables approval without changing reviews/history and falls back to Listen without scoring')
                        context.close()

                        # Return a decodable SVG with HTTP 200 but the wrong digest. Observe the
                        # real install reaching redundant before checking for a readiness marker.
                        Handler.svg_fault = 'wrong-hash'
                        context = profile('wrong-hash')
                        context.add_init_script(INSTALL_STATES)
                        page = context.pages[0]
                        open_home(page)
                        page.wait_for_function("window.__illustrationInstallStates.includes('redundant')", timeout=45000)
                        assert any(r['mode'] == 'wrong-hash' for r in fault_requests)
                        assert not page.evaluate(HAS_READY_MARKER)
                        expect(page.locator('#offline-label')).not_to_contain_text('offline ready')
                        ok('a required SVG with an incorrect hash prevents real precache readiness')
                        assert not errors, errors
                        assert not external_requests, external_requests
                        ok('all illustration flows have no uncaught page errors or external network requests')
                    except Exception:
                        if page is not None and not page.is_closed():
                            try:
                                page.screenshot(path=str(report.parent / 'illustrations-failure.png'), full_page=True)
                            except Exception:
                                pass
                        raise
                    finally:
                        if context is not None:
                            context.close()
            finally:
                server.shutdown()
                server.server_close()

        result = {'status': 'PASS', 'checks': checks, 'version': build['version'],
                  'svgRecords': len(pictures), 'svgAssets': len(asset_paths),
                  'scope': 'Real Chromium, IndexedDB, local SVG responses and service workers; fixture voices only'}
        report.write_text(json.dumps(result, indent=2) + '\n')
        return result
    except Exception as exc:
        report.write_text(json.dumps({'status': 'FAIL', 'checks': checks, 'error': str(exc)}, indent=2) + '\n')
        raise


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--report', default='test-results/illustrations.json')
    run(parser.parse_args().report)
