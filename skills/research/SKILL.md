---
name: research
description: User-value-first research and specification workflow. Use frequently for researching existing features, planning new features, writing content/research reports, product specs, PRDs, technical investigations, stability research, implementation roadmaps, UX/product experience audits, and any document that should output user stories, user value, emotional value, UX/product experience, user-perceived problems, test cases, integration tests, and testable product outcomes before technical details.
disable-model-invocation: false
allowed-tools: Bash(*), Read, Edit, Write, Glob, Grep
user-invocable: true
---

# /research - User-Value-First Research

Use this skill frequently for:

- Researching an existing feature: what it does today, where users feel friction, and how to improve it.
- Planning a new feature: why it should exist, who it helps, what the user journey is, and how to test it.
- Writing research reports, specs, PRDs, technical investigations, stability plans, UX audits, and implementation roadmaps.

The core rule: **start from final user value and user experience, then derive technical work.** Do not write technology-first documents.

## Required Thinking Order

1. **User value**
   - What pain, business outcome, emotional value, confidence, relief, speed, trust, or clarity does this create?
2. **User story and operation**
   - What does the user do?
   - What do they see?
   - What do they expect?
   - What are they afraid will happen?
3. **User-perceived problems**
   - Describe failures as the user experiences them: stuck, lost, confusing, slow, unreliable, scary, silent, unrecoverable.
4. **Test cases from behavior**
   - For each user moment, define the visible state, persisted/recoverable state, next user action, and acceptance criteria.
5. **Technical analysis**
   - Only after the above, map to code paths, data models, APIs, infrastructure, observability, and implementation plans.

## Required Sections

Use these sections unless the user asks for a different format:

1. **Executive Summary**
   - Start with the user's pain and desired experience.
   - Mention technical findings only as support.

2. **User Value**
   - Functional value: what job gets done.
   - Emotional value: what anxiety, uncertainty, friction, or loss of control is reduced.
   - Business value: activation, retention, trust, revenue, support cost, reliability.

3. **User Stories / User Operations**
   - Write concrete stories: "As a user, when I..., I expect..."
   - Include normal, edge, and recovery flows.

4. **User-Perceived Problem Map**
   - Use a table:

| User-perceived symptom | What the user may say | Likely technical areas | Current feedback gap | Product goal |
| --- | --- | --- | --- | --- |

5. **Interaction-First Principles**
   - State the product experience rules that technical work must satisfy.
   - Example: "A failed upload must remain visible and recoverable."

6. **Runtime / System Flow**
   - Map the system only after the user story is clear.
   - Diagrams are useful, but they should explain user outcomes.

7. **Failure Scenario Matrix**
   - Use a table:

| Scenario | User trigger | Current user experience | Technical cause | Risk | Fix | Test case |
| --- | --- | --- | --- | --- | --- | --- |

8. **Test Case Plan**
   - This is mandatory for engineering research.
   - Include unit tests, integration tests, E2E/browser tests, test harness requirements, and merge gates.
   - Tests must assert user-visible behavior, not only internal function return values.

9. **Technical Findings**
   - File/function-level findings with paths.
   - Tie each finding back to a user-perceived problem.

10. **Roadmap**
   - P0/P1/P2 table with user value, technical work, tests, and acceptance criteria.

## Existing vs New Feature Research

### Existing Feature Research

When researching an existing feature, always include:

- Current user journey: entry points, main actions, success state, failure state.
- Current implementation map: relevant UI, API, logic, data, background jobs, integrations.
- User-perceived friction: confusing states, silent failures, missing feedback, slow moments, unrecoverable errors.
- Evidence: code paths, logs, tests, screenshots, product behavior, support/user language when available.
- Improvement plan: what to keep, what to change, what tests must be added first.

### New Feature Research

When planning a new feature, always include:

- Target user and job-to-be-done.
- User value and emotional value.
- Core user stories and edge/recovery stories.
- UX flow: first entry, main operation, empty/loading/error/success states, re-entry.
- Product boundaries: what is intentionally not included.
- Test plan: unit, integration, E2E, analytics/observability, and manual QA.

## Test Case Rules

Every important test case should prove:

1. What the user sees when the issue starts.
2. What state is persisted or recoverable after refresh, reconnect, retry, or navigation.
3. What action the user can take next.
4. What backend invariant proves no silent loss occurred.

Recommended table:

| User interaction | Failure injected | Expected visible behavior | Backend proof | Test type |
| --- | --- | --- | --- | --- |

## Integration Test Requirements

For any non-trivial feature or research report, include an integration test plan. Integration tests should prove that boundaries work together, not just that isolated functions pass.

Cover the relevant boundaries:

- UI -> API contract
- API -> domain logic
- Domain logic -> DB
- DB state -> UI refetch/reload
- File upload -> storage -> downstream consumer
- Queue/job/worker -> persisted user-visible result
- External service failure -> user-facing recovery
- Auth/permission -> product-visible denial state

Use this table:

| Integration path | Setup | Action | Expected persisted state | Expected user-visible state | Failure variant |
| --- | --- | --- | --- | --- | --- |

## Final Output Checklist

Before finishing a research/spec document, verify it contains:

- User value and emotional value
- User stories and user operations
- UX states: empty, loading, success, error, retry/recovery, re-entry
- User-perceived problem map
- Test cases derived from user behavior
- Integration test plan
- Technical findings tied to user impact
- P0/P1/P2 roadmap with acceptance criteria

## Anti-Patterns

Avoid:

- Starting with architecture diagrams before user pain.
- Writing "we need retry/queue/cache" without saying what user confusion or failure it fixes.
- Listing technical tasks without acceptance criteria.
- Treating tests as an afterthought.
- Optimizing for internal elegance while the user still sees a stuck spinner, missing upload, or vague error.
- Hiding emotional value. Trust, confidence, calmness, and control are valid product outcomes.

## Output Standard

The final document should make this chain obvious:

**User value → user operation → user-perceived problem → test case → technical fix → measurable acceptance.**

If that chain is missing, revise before finishing.
