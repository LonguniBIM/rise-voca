# GitHub Pages deployment repair

## Observed failure

At `de53dee91a00acf1cc9a9d0447bed4787cdbad52`, the managed Pages run
`37380737064` successfully built and deployed the repository root with Jekyll.
The artifact log includes `./dist/BUILD_INFO.json`, `./dist/data/weeks/`,
`./dist/manifest.webmanifest` and `./dist/sw.js`, but not their required
root-level counterparts. The root `index.html` starts `src/app.js`, which
fetches `./BUILD_INFO.json` and `./data/weeks/index.json`. It therefore cannot
bootstrap from that publishing root. The source JSON also lacks generated
fingerprints and illustration identities. Publish `dist/`, not the source tree.

The root cause is not a failed artifact upload: the original build, upload and
deployment all succeeded. The Node 20 warning concerns the managed workflow's
`upload-pages-artifact@v3 -> upload-artifact@v4` dependency. The Ubuntu issue
14748 is an advance notice of the ubuntu-latest image transition, not evidence
of a failure in this run, which used Ubuntu 24.04.

## Correct publishing configuration

In Settings > Pages > Build and deployment, select **GitHub Actions** as Source.
Use `.github/workflows/pages.yml`, not the managed branch/Jekyll publishing job.
This one-time repository setting prevents a second workflow from publishing the
source root and racing the validated dist deployment. The GitHub connector used
for the repair exposes file writes, not a Pages settings update operation.
The workflow can submit from the existing main source branch, but changing Source
is still required for one unambiguous long-term deployment path.

The workflow validates the catalog and unit tests, builds, verifies every runtime
asset/hash and runs real-origin browser integration tests before uploading only
dist. Deployment is restricted to main, while pull-request validation is read-only.
It uses explicit Ubuntu 24.04 runners and modern artifact actions; the application
build remains Node 22, independently of the actions' Node 24 runtime.
After deploy, the live root and every runtime dependency are compared against the
validated build, including JavaScript response types and exact bytes.

## .nojekyll and offline data

Keep `.nojekyll` at the published root for direct static hosting. It prevents
Jekyll processing but does not build the application or move dist into place.
It is not an application asset and must not be fetched by the offline worker.
The build now excludes it from offline-manifest.json and the worker's FILES list,
while preserving it in dist and including hidden files in the upload.

No learning-domain, speech, IndexedDB schema, namespace, session ID or content ID
is changed. No code clears site data or learner history. The application version
fingerprint changes because the build recipe changes; vocabulary fingerprints
remain unchanged. Wait for the update, Save & pause, close all app tabs/windows,
and reopen. Do not clear browser data as an update procedure.

## Verification commands

```sh
npm run validate
npm test
npm run build
node scripts/build.mjs --check
node scripts/check-pages.mjs
python tests/browser.py --report test-results/browser.json
node scripts/check-pages.mjs --url https://longunibim.github.io/rise-voca/
```

Use disposable browser profiles. Local unit/DOM tests do not establish actual
IndexedDB, service-worker or device-audio behavior. Physical iPad/iPhone/Android
installation and audible offline speech remain separate acceptance checks.
The historical SOURCE_SHA256.json is the original delivered ZIP inventory,
not a live repository checksum manifest.
