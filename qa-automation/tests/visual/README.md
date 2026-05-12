# Visual regression — snapshot management

## What it does

Captures pixel-level baselines of critical screens. On every run we
compare current rendering against committed baselines. Differences over
**1% pixel ratio** (or 100 raw pixels, whichever is larger) fail the
test.

Catches: layout regressions, accidental CSS bleed, broken responsive
breakpoints, font swaps, color theme drift, missing icons.

Does NOT catch: text content changes (we mask those), functional
regressions (use the E2E suite), accessibility issues (use the a11y
suite).

## Coverage

| Spec | Snapshots | What it locks down |
|---|---|---|
| `homepage.visual.spec.ts` | 3 | Hero, full scroll, footer |
| `search.visual.spec.ts` | 2 | Results grid, single card |
| `property-detail.visual.spec.ts` | 1 | Detail page chrome |
| `wallet.visual.spec.ts` | 1 | Authenticated wallet page |
| `admin-overview.visual.spec.ts` | 2 | Console + nav |
| `i18n.visual.spec.ts` | 4 | Homepage in EN/HI/KN/TA |
| `responsive.visual.spec.ts` | 6 | Homepage + search at 3 viewports |
| **Total** | **19 PNGs** | — |

Bounded growth: every new spec **must** declare what it covers in this
table. PRs that add more than 3 new snapshots need architect approval.

## The golden workflow — when a snapshot fails

1. **Don't immediately update.** Look at the diff first.
2. CI uploads `playwright-report/` as an artifact. Download it.
3. The HTML report shows:
   - The committed baseline
   - The new rendering
   - A red overlay of where they differ
4. Three outcomes:
   - **Intended change** — update the baseline (see "Updating baselines")
   - **Unintended regression** — fix the code, don't update the baseline
   - **Flaky** (intermittent fail) — open an issue, add to the masking, don't paper over

## Updating baselines

```bash
# Locally — generates fresh PNGs for ALL visual specs
cd qa-automation
npx playwright test --project=visual --update-snapshots

# Just one spec
npx playwright test tests/visual/homepage.visual.spec.ts --update-snapshots

# Just one snapshot inside a spec
npx playwright test tests/visual/homepage.visual.spec.ts -g "hero" --update-snapshots
```

After this:

```bash
git status                            # shows the new/updated PNGs
git diff -- '*.png'                   # binary diff is unreadable; use the HTML report
git add tests/visual/**/__snapshots__/
git commit -m "visual: update snapshots — intentional design change to X"
```

The commit message **must** explain WHY you updated. Reviewers will
otherwise ask.

## Linux-only baselines — and why

Visual tests are notoriously flaky across operating systems because of
font antialiasing. macOS, Windows, and Linux render the same TrueType
font with different sub-pixel patterns. Committing a macOS-generated
baseline causes CI (Linux) to fail forever.

**Rule:** Always generate baselines inside the Playwright Linux Docker
image. Easiest way:

```bash
docker run --rm \
  -v $(pwd):/work -w /work \
  -e BASE_URL=http://host.docker.internal:3000 \
  mcr.microsoft.com/playwright:v1.49.0-jammy \
  bash -lc "npm ci && npx playwright test --project=visual --update-snapshots"
```

Or skip the headache: do snapshot work in CI itself via the
"update-snapshots" workflow_dispatch job (defined in `.github/workflows/qa.yml`).

## Anti-patterns

- ❌ Updating snapshots in the same PR that adds the test — reviewer can't tell
  what changed
- ❌ Mass `--update-snapshots` to "make CI green" — that's how regressions hide
- ❌ Increasing `maxDiffPixelRatio` to 0.1 because something looks "close enough"
  — fix the source of the diff, don't broaden the tolerance
- ❌ Snapshotting volatile data (live timestamps, balances, random IDs)
  without masking — your test will fail every run
- ❌ Removing `prepareForSnapshot()` to "make the test go faster" — the
  fontload/image-load wait is what prevents flakes

## Adding a new visual test

1. Pick the surface — only critical or layout-heavy screens deserve a snapshot.
2. Use the `prepareForSnapshot(page)` + `dismissTransientUi(page)` combo before every screenshot.
3. Mask dynamic regions with `dynamicMasks(page)` plus any page-specific volatile content.
4. Generate the baseline inside Linux (Docker or CI).
5. Commit the PNG **alongside** the spec — never as a separate PR.
6. Update the coverage table above.

## File layout

```
tests/visual/
├── homepage.visual.spec.ts
├── homepage.visual.spec.ts-snapshots/
│   ├── homepage-hero-visual-chromium-linux.png
│   ├── homepage-full-visual-chromium-linux.png
│   └── homepage-footer-visual-chromium-linux.png
├── search.visual.spec.ts
├── search.visual.spec.ts-snapshots/
│   └── …
└── README.md
```

Playwright auto-creates the `-snapshots/` directories on first run.
