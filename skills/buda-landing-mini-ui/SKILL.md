---
name: buda-landing-mini-ui
description: Use when creating or editing Buda landing page mini UI demos, feature-card animations, homepage workbench mockups, or marketing UI vignettes in apps/buda.
---

# Buda Landing Mini UI

Use this skill before editing `apps/buda` homepage feature cards, animated product vignettes, or mini workbench mocks.

## Read First

Read the real implementation for the product surface being summarized. Prefer current code over screenshots or memory.

Primary references:
- `apps/buda/src/domains/marketing/components/FeaturesSection.tsx`
- `apps/buda/src/domains/marketing/components/features-tools-section.tsx`
- `apps/buda/src/components/animations/demos/hero/`
- `apps/buda/src/components/animations/demos/bento/`
- `apps/buda/src/domains/agent-controller/components/agent-workbench-layout.tsx`

## Shared Pattern

Treat every mini UI as a compressed product scene, not an illustration.

Each scene should have:
- One clear product claim.
- A recognizable real Buda surface or real external surface.
- A concrete actor, action, and result.
- Enough product density to feel authentic at feature-card scale.
- A short sequence that explains causality without visible instructional text.

Show product behavior instead of adding explanatory labels.

## Buda Mini UI Grammar

- Workbench demos should use a real-feeling structure: sidebar, top bar, agent selector, selected agent, and right-side panels/tabs when relevant.
- Workbench split-view tabs such as `Local Browser` belong in the same top bar row as the active agent/chat tab. Do not create a second nested header inside the right panel.
- Channel demos should pair an external chat surface with Buda web and keep message content aligned.
- Marketplace demos should use real tab categories, selected states, listing cards, and install/deploy actions.
- Drive demos should show `Agent Drive` / `Space Drive` scope switching through a dropdown and then change the file list.
- Tool demos should show tool pills and a concrete artifact preview, not a generic manager screen.
- Tool/skill execution pills should follow the hero `ToolBadge` grammar: a vertical stack, one pill per row, width fitted to content, aligned left. Do not arrange tool pills in a horizontal row like tabs.
- Reuse the shared animation UI atoms (`UserMessage`, `AgentMessage`, `ToolExecution`) when a mini UI needs chat bubbles or skill/tool pills. Add only local sizing constraints at the call site instead of rebuilding the same shapes with ad hoc class strings.
- Tool/skill pill text should be quiet and lightweight. Use small regular/medium-at-most typography; do not make pill labels feel bold like section titles.
- Tool/skill execution pills should be mostly flat: warm background, thin border, no obvious drop shadow unless copying a real floating popover.
- Game-generation demos should show an agent, tool execution, and a local browser/game artifact.
- Coding/game demos should include the product build bridge when relevant: chat/tool execution -> terminal/build output -> local browser artifact.
- Bottom terminal panels in mini workbenches should behave like real bottom panels and take layout space when they appear. When the panel opens, scroll the chat transcript so the newest relevant message remains visible at the bottom of the remaining chat area.
- Mini UI text should feel like product copy or real user content, not annotations for the viewer.

## Motion Grammar

Motion must explain cause and effect.

- Cursor or visible UI action comes before the state change.
- Show a press/down moment when simulating clicks.
- Use Mac-style cursor when a cursor is shown.
- Zoom/pan should act like camera direction: selected agent -> chat/tool execution -> artifact/panel.
- Coding/game workbench stories should start by identifying the selected sidebar agent, then move the camera to the chat as the first user message appears, then recover to a global workbench view before terminal and browser panels appear.
- When the full work sequence is ready to be understood as a whole, recover the zoom to a more global view before moving into the next panel or artifact.
- In final artifact/browser states, the camera must include the full right panel content, not just the tab header or a clipped preview edge.
- Recovered/global camera states must keep the workbench top bar visible inside the card crop. Do not let zoom/pan crop the top toolbar, selected agent, or panel controls.
- Recovered/global camera states should keep the active conversation readable, including right-aligned user messages. Do not over-prioritize the left sidebar if it causes the right side of the chat or panel to be clipped.
- For workbench zoom-ins, prioritize keeping the top toolbar fully visible. It is acceptable to crop or completely hide the left sidebar if the scene needs more room for the active chat, tools, terminal, or browser panel.
- When the camera moves from selected agent to chat, avoid leaving a narrow half-visible sidebar strip. Either show the selected agent intentionally, or pan far enough that the sidebar is fully outside the card crop.
- Chat camera moves can change per beat: bias toward the user bubble when it appears, then ease back or scale down when agent replies and tool pills appear so both sides of the conversation remain readable.
- Once the camera has settled into the chat/work phase, keep zoom and pan stable across additional agent replies and tool pills. Use transcript scrolling, not camera zoom changes, to reveal newer content.
- When a chat message is the first narrative beat, the camera should already be aimed at the message area as it appears. Do not spend the opening beat centered on the sidebar unless the selected agent itself is the point.
- Chat mini UIs should simulate viewport scrolling: when new messages or tool pills appear, move the existing message stack upward instead of only fading new items in place.
- Hold briefly after important states so viewers can read them.
- Tool/skill pills should follow the agent reply promptly. Avoid long empty pauses before execution pills appear; use a short stagger so the sequence feels active.
- Avoid decorative zooms, random sideways drift, or motion that does not map to product behavior.
- Keep loops moving; avoid long dead pauses between cycles.
- For cross-surface demos, use push/slide continuity. At least one surface should remain visible; do not let both disappear.

## Visual Grammar

- Use warm off-white/parchment surfaces, thin borders, compact rounded controls, and soft warm shadows.
- When a feature card already frames the mini UI, the inner demo wrapper should be a transparent clipping viewport, not another same-color card with its own border/ring/shadow.
- Workbench scene shadows should belong to the actual product surface being shown. Do not create a fake outer card just to get elevation; add a subtle warm shadow and thin border to the workbench surface itself.
- Use existing surface tokens (`bg-background`, `bg-card`, `bg-muted/*`) for work areas before hand-writing color values. Buda's `--background` is already a warm parchment; do not push mini UI work areas into noticeably yellow bespoke colors.
- Chat bubbles should use the same grammar across landing demos: right/user bubbles use warm gray fill with a thin border and no shadow; left/agent bubbles use white or near-white fill with a thin border and at most a barely visible shadow.
- Avoid hard shadow bands, dirty gray slabs, or shadows cut by a sharp edge.
- Mini UIs may be clipped by a feature-card viewport, but the crop should feel intentional.
- In feature cards, avoid pushing mini UI demos to the bottom with `mt-auto` unless the card is explicitly designed for bottom alignment. Large dead space between copy and product scene weakens the narrative.
- Global edge fades or masks must not cover terminal panels, browser previews, or delivered artifacts. Disable or move the mask once those panels become the focal content.
- Preserve real hierarchy: sidebar widths, toolbar icon positions, selected-agent placement, tab positions, and panel boundaries.
- Compress sidebar spacing for feature-card scale. Keep real hierarchy, but use compact nav gaps (`space-y-1`/small vertical padding) so sidebar items do not look like full-size app chrome pasted into a mini UI.
- Keep scale compact enough for the card; avoid oversized listing cards or chat bubbles that dominate the scene.
- Game/browser artifacts should not use oversized mobile-card radius. Keep game preview outer radius at or below 8px and canvas radius tight, around 4-6px, unless the real UI being copied is rounder.
- Browser/game previews should stay within the Buda warm neutral palette unless the real artifact requires a dark canvas. Avoid large black blocks that overpower the feature card.
- Use lucide icons where the app already does; keep stroke weight consistent.

## Copy Grammar

- Prefer English inside mini UIs unless the real surface or locale requires otherwise.
- Keep copy short but substantial.
- Cross-surface copy must match in meaning. Telegram can omit Buda-only tool pills, but it must not contradict the web surface.
- Show concrete result content when the claim is about output.
- Avoid filler statuses unless the product actually shows them and they are the point of the scene.

## Do Not

- Do not show `Agent Canvas` as a visible title/status in landing mini UIs.
- Do not show `Skills Manager` or `Publish Skill` for game-generation mini UI scenes.
- Do not invent toolbar or panel icon placement for convenience.
- Do not use labels that explain the mock instead of representing real UI.
- Do not pack tool/skill pills horizontally; they are sequential execution artifacts, not a toolbar.
- Do not make hover/selected states active before the cursor reaches the target.
- Do not make a state change happen before the click that should trigger it.
- Do not use stale tab groups such as `Agent / Drive / Browser / Terminal` unless the current real UI still uses them in that location.

## Scenario Mapping

- Layout modes: show space selector/card open -> focus/layout entry click -> single agent/company layout switch.
- Drive scopes: show dropdown click -> agent/space option -> changed file list.
- Marketplace: show `All / Agents / Teams / Skills` tabs and matching listing cards.
- Channels: show Telegram and Buda web synchronized; use the same request/result narrative on both.
- Tool work: show a concrete live tool state and delivered artifact.
- Game build: show Coding Agent -> Code Generator/Game Renderer/Game Loop -> local browser game preview.

## Verification

After editing mini UI code:

- Search for forbidden stale labels:
  `rg -n "Agent Canvas|agent canvas|Skills Manager|Publish Skill" apps/buda/src/domains/marketing apps/buda/src/components/animations/demos`
- Format/check edited files:
  `pnpm exec biome check <edited-files> --write`
- For TypeScript UI changes:
  `pnpm --filter buda typecheck`
- Preview `http://localhost:3040/en` and inspect at the actual card size.
