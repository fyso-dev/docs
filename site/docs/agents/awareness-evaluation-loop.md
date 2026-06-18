---
sidebar_position: 13
---

# Evaluation and Self-Improvement Loop

The framework should improve from daily use, but it should not mutate itself silently. Self-improvement means the agent observes friction, scores the process, proposes changes, and opens a reviewed documentation change when the improvement is justified.

## Improvement Boundary

| May happen automatically | Requires human review |
|--------------------------|-----------------------|
| Generate a daily evaluation note | Change the versioned framework |
| Detect stale awareness state | Post worklogs to Jira or external tools |
| Suggest better templates | Merge methodology changes |
| Flag noisy or missing fields | Store new durable personal memory |
| Prepare an improvement PR | Apply organization-wide rules |

This keeps the loop useful without letting local mistakes become global policy.

## Cadence

| Cadence | Evaluation |
|---------|------------|
| Task switch | Was the previous task left with a clear state and next action? |
| Session handoff | Can another agent continue from the awareness board and worklog? |
| End of day | Can the day be summarized by task ID with evidence? |
| Weekly | Did recurring failures justify a template or rule change? |

## Signals to Track

Track process quality from the private worklog and awareness board:

- stale `Current Focus`
- active tasks without `Next`
- worklog entries without task IDs
- worklog entries without evidence
- repeated blockers with no owner or next checkpoint
- external task IDs discovered late
- chat-only decisions not reflected in the worklog
- excessive detail that makes the awareness board expensive to read
- end-of-day summary edits caused by missing context

## Scoring Rubric

Use a small rubric so evaluation stays cheap.

| Dimension | 0 | 1 | 2 |
|-----------|---|---|---|
| Freshness | Awareness state is stale or misleading | Mostly current, with minor gaps | Current focus and task states are accurate |
| Traceability | Work cannot be tied to task IDs or evidence | Some work is traceable | Most meaningful work has task ID and evidence |
| Handoff quality | Another agent would need chat history | Next actions exist but lack context | Another agent can continue from files alone |
| Noise control | Files are too verbose or obsolete | Some cleanup needed | Current board is compact and useful |
| External reporting | End-of-day summary needs reconstruction | Summary exists with manual fixes | Summary is ready for human review |

Scores are diagnostic, not performance ratings. A low score should produce a targeted improvement proposal.

## Daily Evaluation Template

```markdown
# Awareness Evaluation - YYYY-MM-DD

## Score

| Dimension | Score | Evidence |
|-----------|-------|----------|
| Freshness | 0-2 | What was current or stale |
| Traceability | 0-2 | Missing or present task IDs/evidence |
| Handoff quality | 0-2 | Whether next actions were clear |
| Noise control | 0-2 | What should be trimmed |
| External reporting | 0-2 | How much rewrite was needed |

## Observations

- What worked well enough to keep
- What caused missing context or duplicate effort
- What should be changed in templates or rules

## Proposed Changes

- No change
- Local habit change
- Template adjustment
- Framework documentation PR
```

## Weekly Improvement Process

1. Review daily evaluation notes and identify recurring issues.
2. Group issues into one of three buckets: local habit, template gap, or framework rule gap.
3. Promote a change only when the same issue appears repeatedly or causes material rework.
4. Prefer removing or simplifying fields before adding more fields.
5. Open a documentation PR for framework changes.
6. Keep private examples redacted or synthetic.

## Change Proposal Template

```markdown
# Framework Improvement Proposal

## Problem

What repeated failure or costly handoff issue was observed?

## Evidence

- Dates or redacted examples
- Missing worklog fields
- Stale awareness states
- Rework caused during end-of-day reporting

## Proposed Change

The smallest rule, template, or lifecycle change that addresses the issue.

## Expected Effect

How the change improves traceability, handoff, or reporting.

## Rollback Criteria

When the change should be removed or softened because it adds noise.
```

## Decision Rules

- Add a rule only when a repeated failure cannot be solved by a local habit.
- Add a field only when it improves handoff or end-of-day reporting.
- Remove fields that agents fill with low-value boilerplate.
- Convert repeated user corrections into template improvements.
- Keep the current board optimized for the next action, not for historical completeness.
- Keep the worklog optimized for evidence, not for prose.
- Change the framework through pull requests, not through hidden local edits.

## Example Outcomes

| Observation | Improvement |
|-------------|-------------|
| Many entries say `Unassigned` but later map to Jira | Add an end-of-day prompt to reconcile unassigned entries |
| Blockers remain stale for days | Add `Since` and `Needed to unblock` to blocked tasks |
| Awareness board grows too large | Add an end-of-day cleanup step |
| Test evidence is often missing | Add `Evidence` to the worklog required fields |
| Agents over-log trivial actions | Clarify that only concrete progress and state changes need entries |
