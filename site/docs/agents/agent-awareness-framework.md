---
sidebar_position: 11
---

# Agent Awareness Framework

The Agent Awareness Framework is a working methodology for humans who use several AI coding agents across parallel tasks. It is not a product feature, a task runner, or a replacement for Jira. Its purpose is to make agent work traceable enough that a human can reconstruct the day, produce accurate worklogs, and hand work from one agent session to another without relying on hidden model memory.

## Scope

Version the methodology, not the private state.

| Artifact | Location | Versioned? | Purpose |
|----------|----------|------------|---------|
| Framework docs | Shared documentation repository | Yes | Canonical operating rules, templates, evaluation rubric |
| Agent instructions | User or repo agent config | Optional | Small entrypoint that points agents to the framework |
| Awareness board | Local private file | No | Mutable current state for active, paused, blocked, and waiting tasks |
| Daily worklog | Local private file | No | Append-only chronological evidence of the day |
| Personal memory | Local private file or managed memory store | No | Preferences, durable facts, and repeated context |

Real `awareness`, `worklog`, and personal memory files must stay outside version control. Only sanitized templates and rules belong in the repository.

## Operating Principles

1. Keep operational state explicit. Agents should read the current private awareness file before acting and should update it when focus, blockers, or task state changes.
2. Keep history append-only. A daily worklog is the chronological record; corrections are new entries, not rewrites.
3. Keep the live board small. The awareness file should contain the current working set, not the full history of the week.
4. Tie work to external IDs when available. If a Jira issue, GitHub issue, or PR exists, record it. Do not invent identifiers.
5. Record evidence, not narration. Prefer file paths, commands, test results, PR links, commit hashes, and blocker details.
6. Separate framework improvement from daily execution. Agents may propose methodology changes, but changes to the framework are reviewed through normal version control.
7. Require human confirmation before writing to external systems. Daily summaries can be prepared automatically, but Jira worklogs, comments, status transitions, and public updates should be confirmed.

## Lifecycle

### 1. Initialization

At the start of a session, the agent reads the private awareness board and identifies:

- current focus
- active and paused tasks
- blockers and waiting states
- task IDs related to the user's request
- the expected next action

If the user's request conflicts with the current focus, the agent records a task switch before continuing.

### 2. Task Start

When a task starts, the agent creates or updates a task block in the awareness board with:

- task ID or `Unassigned`
- repository, branch, or workspace
- state
- next action
- blockers, if any
- evidence collected so far

The daily worklog receives a short start entry.

### 3. Progress

The agent appends to the worklog after concrete progress:

- files created or changed
- tests, builds, or checks run
- commits, PRs, or deployment actions
- decisions that affect implementation
- blockers or handoff points

The awareness board is updated when the task state changes, not after every minor edit.

### 4. Task Switch

When switching tasks, the agent marks the previous task as `paused`, `blocked`, `waiting`, or `done`, then makes the new task the current focus. The worklog records the switch with both task IDs when available.

This is the core support for parallel work: only one `Current Focus` exists, but many tasks can remain active or paused with an explicit next action.

### 5. Handoff

Before returning control to the user, the agent ensures the awareness board answers:

- What is the current focus?
- What changed?
- What evidence exists?
- What remains next?
- What is blocked or waiting?
- Which entries are candidates for end-of-day reporting?

The final worklog entry should make the handoff reconstructable without reading the whole chat transcript.

### 6. End of Day

At the end of the day, the agent prepares a grouped summary from the daily worklog:

- by Jira issue or external task ID
- by repository or workspace
- by outcome
- with evidence links or command results
- with unresolved blockers

The user reviews and confirms any external posting.

## Parallel Task Model

Use the awareness board as a compact state index:

| Section | Meaning |
|---------|---------|
| Current Focus | The one task the current agent session is actively serving |
| Active Tasks | Work that can continue without waiting on external input |
| Blocked Tasks | Work that cannot progress and why |
| Waiting On User | Decisions, credentials, approvals, or clarifications needed from a human |
| Parking Lot | Relevant but intentionally deferred ideas |
| End-of-Day Candidates | Items likely to become Jira worklog or status-report material |

For parallel work, each task block should carry a short `Next` field. If the next action is not clear, the task is not ready for handoff.

## Relationship to Task Managers

This framework can coexist with Jira, GitHub issues, Taskmaster-style project task files, or sprint boards.

- Use Jira or GitHub as the external planning and accountability system.
- Use project task managers for decomposition inside a repo.
- Use the awareness board for immediate cross-agent operational state.
- Use the daily worklog for chronological evidence and end-of-day reporting.

The framework should not duplicate every field from external task systems. It stores only the context needed for the next agent session and the final worklog.

## Implementation Notes

Recommended private local layout:

```text
~/.agents/
  AGENTS.md
  awareness/
    current.md
  worklog/
    YYYY-MM-DD.md
  memory/
    preferences.md
    patterns.md
```

Agent-specific instruction files can be thin wrappers that point to the canonical private `AGENTS.md`. Prefer regular wrapper files over symlinks when a CLI, sandbox, sync engine, or editor may not resolve links consistently.

See [Awareness and Worklog Templates](./awareness-worklog-templates.md) for sanitized templates and [Evaluation and Self-Improvement Loop](./awareness-evaluation-loop.md) for the improvement process.
