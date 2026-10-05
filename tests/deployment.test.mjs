import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {checkDirectory} from '../scripts/check-pages.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
execFileSync(process.execPath, ['scripts/build.mjs'], {cwd: root});
test('built publishing root contains all boot, manifest and cache dependencies', () => {
  assert.match(checkDirectory(path.join(root, 'dist')).version, /^1\.0\.0-/);
});
test('source root reproduces the missing generated deployment assets', () => {
  assert.throws(() => checkDirectory(root), /Publishing directory is incomplete: BUILD_INFO/);
});
test('missing dependency and altered bytes fail the publishing gate', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'rise-pages-'));
  try {
    fs.cpSync(path.join(root, 'dist'), temporary, {recursive: true});
    fs.appendFileSync(path.join(temporary, 'src/app.js'), '\n// corrupted deployment fixture');
    assert.throws(() => checkDirectory(temporary), /hash mismatch/);
    fs.rmSync(path.join(temporary, 'data/weeks/index.json'));
    assert.throws(() => checkDirectory(temporary), /incomplete/);
  } finally { fs.rmSync(temporary, {recursive: true, force: true}); }
});
test('nojekyll is retained for hosting but excluded from runtime cache requests', () => {
  assert.ok(fs.existsSync(path.join(root, 'dist/.nojekyll')));
  const offline = JSON.parse(fs.readFileSync(path.join(root, 'dist/offline-manifest.json')));
  assert.ok(!offline.files.some(entry => entry.path === '.nojekyll'));
});
