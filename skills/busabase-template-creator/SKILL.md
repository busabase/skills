---
name: busabase-template-creator
description: >-
  Bring a Busabase template up to catalog-publishable quality and keep it there: a generated cover
  as the first gallery image, screenshots rich enough to show the workflow, no upstream author's
  branding anywhere in pixels or demo data, sample records so it is not empty on first open, and a
  clean `busabase-cli check`. Use when contributing to or auditing github.com/busabase/templates,
  when a template looks correct but reads cheap, or before publishing a batch. Delegates format and
  correctness to busabase-app-creator; this skill only adds the publishing bar on top.
---

# Busabase Template Creator

`busabase-app-creator` already answers *is this a valid template* — the package format, the
contract, the runtime, the security boundary. It says so itself: "the contract here is **format and
correctness, not taste**." This skill answers the question it deliberately leaves open: **is this
good enough to put in a public catalog with our name on it.**

Everything below is additive. Never restate, re-derive, or contradict a rule that
`busabase-app-creator` owns; call it instead.

## Which skill am I in?

These names look interchangeable and are not. Read this before deciding where a change belongs.

| Skill | Owns | Answers |
| --- | --- | --- |
| `busabase-app-creator` | AirApp modeling, package/template **format**, contract, security, runtime, deployment, maintenance. The single technical source of truth. | Is it correct? Will it install? | 
| `busabase-template-creator` (this) | Cover, screenshot coverage, brand hygiene, demo-data quality, publishing gate for `busabase/templates`. | Is it good enough to publish? |
| `kelly-app-skill-creator` | The same layer as this skill, for a different catalog (`mr-kelly/skills`) with its own taste. | Is it good enough for *that* catalog? |

Two traps worth naming, because both have cost real time:

- **"App vs template" is not the split.** `busabase-app-creator` authors templates too — its
  package-first route and `references/template-format.md` are exactly that. The split is
  *correctness vs publishability*, not *app vs template*.
- **`busabase-package-creator`, `busabase-skill-creator`, and `busabase-app-package-creator` are
  symlinks to `busabase-app-creator`**, not separate skills. If four names feel like the same
  thing, that is because four of them literally are.

To change a **format or correctness** rule, edit the `busabase-app-creator` skill itself. Do not
fork its rules into this file.

## The publishing bar

A template ships when all of these hold. Each is checkable; none is a matter of opinion.

### 1. It passes the format gate

```bash
npx busabase-cli check ./<name>
```

Zero errors. Warnings are allowed only when the reason is written down in the PR — the format
reference is explicit that warnings are "documented defaults worth defending in review."

This is a precondition, not the finish line. `busabase-app-creator` explains why a green validator
does not prove a working install; this skill does not repeat that argument, it inherits it.

### 2. It has a generated cover, and the cover is first

`assets/screenshots/cover.webp`, 1440×900, pinned at `template.screenshots[0]`. Generate it — never
hand-compose it:

```bash
python3 <templates-repo>/skills/busabase-template-cover/scripts/generate_cover.py <template-dir>
python3 <templates-repo>/skills/busabase-template-cover/scripts/generate_cover.py --check <template-dir>
```

The renderer owns the layout and enforces its own safe areas; that skill's `SKILL.md` is the
contract. Two ordering rules that are not obvious and have both bitten:

- **Generate the cover *after* capturing screenshots, never before.** The cover is rendered *from* a
  real screenshot, so a cover made from a stale screenshot is stale.
- **A screenshot-capture pass must skip `cover.webp`.** Capture tools that enumerate
  `assets/screenshots/*` treat the cover as a route (`#/cover`), silently overwriting a designed
  cover with a picture of whatever that route falls back to.

### 3. Screenshots are rich enough to sell the workflow

Not "has at least one image." A card that shows only a landing view proves nothing about the
product. Cover at least:

- the overview / landing state,
- the core working surface (the queue, the board, the list that carries the job),
- the human-attention state — what needs review, what is blocked. For a review-queue app this is
  the whole point; a gallery that never shows it is advertising the wrong product.

Both locales when the app ships both. Uniform viewport across the catalog — mixing framed
(window-chrome) and unframed shots produces a frame-inside-a-frame in the cover, with the template
name printed twice.

**Do not ship a "this is a mock image" disclosure baked into the app's own demo mode.** Some
templates render a banner (e.g. a `demo-visuals.js`/`.css` panel gated on `?demo=1`) explaining that
certain images are synthetic placeholders. It never reaches a real installed template — real users
never pass `?demo=1` — so it is dead weight from their side, and from the gallery's side it is
actively harmful: `busabase-template-cover` requires the screenshot's *top* edge to stay inside the
canvas while only the bottom may overflow, so anything pinned to the top of a demo page is
guaranteed visible in the cover. A disclosure banner nobody but a screenshot tool ever sees ends up
permanently occupying the highest-value real estate in the card, pushing the actual product below
the fold. If a template has one, remove it (client-side file + `<link>`/`<script>` tags + the
`demo_visuals` wiring in the demo provider, or the server-side equivalent) and re-capture.

### 3.5. A recorded demo clip is optional, but if present it is second, right after the cover

Not every template needs one. When a workflow genuinely benefits from motion — a multi-step
approval, a state that visibly changes — a short clip earns its place ahead of static screenshots in
the gallery order: cover (always first) → clip (if present) → screenshots.

- Store at `assets/recordings/<name>.mp4`, tracked with Git LFS (`assets/recordings/**/*.mp4 filter=lfs diff=lfs merge=lfs -text` in `.gitattributes`).
- 1440×900, H.264, `yuv420p` (not `yuvj420p` — force `-color_range tv` in the ffmpeg encode, since JPEG-sourced frames default to full-range and produce the "j" variant, which some players flag).
- Show real interaction — sidebar navigation between views, search/filter, a language toggle — not a static hold. Verify every clip frame-by-frame after recording; do not trust that a scripted click landed. A text-substring match against sidebar link text is not reliable when the same word appears elsewhere on the page (a stat-card label, a nav link) — `.find()` silently takes whichever matches first in DOM order. Use the app's `data-route` attribute for hash navigation instead: deterministic, and consistent across this catalog's templates.
- Most templates in this catalog are display-only by architecture — the AirApp shows a review queue but the actual approve/reject decision happens in Busabase's native ChangeRequest review UI, not a button in the app. Do not fake a click on an approval control that does not exist; record the real interaction the app actually offers (navigation, filtering, the review-queue *reading* experience) and say so plainly rather than implying a write action the demo cannot perform.
- `ffprobe` after encoding to confirm codec/dimensions/duration before treating a clip as done.

### 4. No upstream branding survives, in pixels or in data

A migrated template carries the original author's name in more places than a find-and-replace
reaches. Check all four:

| Where | Why grep misses it |
| --- | --- |
| Screenshot pixels | Text substitution edits source, not images. Re-capture is the only fix. |
| A rename that fired on a proper noun | Produces grammatical wreckage like `the operator Invest` in a sidebar. Scanning for the *old* name will not find it. |
| Select-option `name`, `appTitle`, `brand-title`, demo display names, email sign-offs | User-visible strings that look like config. |
| Sibling references in `.js`/`.css` comments and `package.json` descriptions | A sweep limited to `SKILL.md`/`README.md` leaves every one of these behind. |

Verify with OCR over the rendered images, not by reading source — and scan for **both** the
un-renamed form and the wrongly-renamed one. A single-pattern sweep once reported a clean catalog
while `the operator Invest` sat in a sidebar.

### 5. It is not empty on first open

`content/<base>/records.ndjson` with realistic rows (≤50 per Base). The app's own demo provider is
the right source — then demo mode and a fresh install tell the same story. Validate every field
against the Base's declared schema before shipping: a snapshot builder decorates rows with derived
view state that was never a column.

### 6. `agentPrompts` are declared and specific — at BOTH levels

**Template level** (`busabase.json` → `template.agentPrompts`): two is enough, but they must name
the template's own objects. "Summarize what needs my attention" is a placeholder; "Summarize the
retouch batches and flag what needs my approval" is a prompt. This is what the Template Center card
shows, and it sells the template.

**Node level** (`agentPrompts` in each node's sidecar — `base.json`, `_node.json`, `_folder.json`,
a file node's `.node.json`, a Doc's frontmatter): 2–5 per node, for what people actually do with
THAT node. This is what the user meets *after* installing, and its absence is the "there is data,
now what" gap — they open the customer table and the only things on offer are `Create record` /
`Delete field`, which is the API talking, not the app.

`busabase-cli check` reports a node without them as `template/node-without-prompts`. It is a
warning, never an error: a template with none still installs and behaves exactly as templates did
before the field existed. Treat the warning as the to-do list for bringing an older template up to
this bar, not as breakage.

Same writing rules as `busabase-app-creator` step 10 — say what the person wants in their words
("log a customer visit"), not which column to write ("update the status field"); open the body by
telling the agent to read the folder's skill; and give `{target}` its own line, because it expands
to a complete sentence.

Fastest way to add them to an existing template: install it into a scratch Space, write the prompts
against the real nodes with `busabase-cli nodes set-agent-prompts`, click through them once to see
they read right, then `busabase-cli export --template` and diff the sidecars back into the package.

## Auditing an existing template

```bash
npx busabase-cli check ./<name>                                      # 1
python3 <cover-skill>/scripts/generate_cover.py --check ./<name>     # 2
```

Then, by hand or by script: screenshot coverage (3), a brand sweep including OCR (4), sample rows
against schema (5), and `agentPrompts` (6). Report each numbered item as pass/fail with evidence.
Do not report "looks good" — that is the failure mode this skill exists to prevent.

## Publishing

The target repository is <https://github.com/busabase/templates>. **Read its `AGENTS.md` first**;
it owns where a template goes and what is generated, and this file must not override it. Rebuild the
catalog index with the command that repo requires rather than hand-editing `templates.json`.
