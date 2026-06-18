---
sidebar_position: 12
---

# Awareness and Worklog Templates

These templates define the private files used by the Agent Awareness Framework. Do not commit real instances of these files. They may contain client names, task details, repository paths, decisions, credentials context, or personal working patterns.

## Private File Layout

```text
~/.agents/
  AGENTS.md
  awareness/
    current.md
  worklog/
    2026-06-18.md
  memory/
    preferences.md
    patterns.md
```

The repository should contain only sanitized templates, examples, and rules.

## Canonical Agent Instructions Template

Use this as the canonical private instruction file and adapt it for each agent CLI.

```markdown
# Agent Awareness and Worklog Protocol

You operate in a multi-task, multi-agent environment. Before doing work, read the private awareness board and maintain the private daily worklog.

## Required Files

- Awareness board: `~/.agents/awareness/current.md`
- Daily worklog: `~/.agents/worklog/YYYY-MM-DD.md`
- Optional durable memory: `~/.agents/memory/`

## Lifecycle

1. On session start, read the awareness board.
2. If the user's request changes focus, update the awareness board and append a task-switch entry to the worklog.
3. When concrete progress happens, append to the daily worklog.
4. When state changes, update the awareness board.
5. Before handoff, make the awareness board reflect the exact current state and append a final worklog entry.

## Rules

- Keep the worklog append-only.
- Do not invent task IDs.
- Record evidence: paths, commands, test results, commits, PRs, deployments, blockers.
- Keep private state out of version control.
- Ask before posting worklogs, comments, status changes, or summaries to external systems.
```

## CLI Wrapper Template

Each agent CLI can have a small regular file that points to the canonical private instructions. Use the import syntax supported by that CLI when available; otherwise, make the wrapper instruct the agent to read the canonical file.

```markdown
# Local Agent Instructions

Read and follow the canonical private protocol at:

@/Users/example/.agents/AGENTS.md

If your CLI does not expand `@` imports automatically, open that file explicitly before starting work.
```

Keep wrappers small. The framework should live in the versioned documentation; the local operational rules should live in the canonical private file.

## Awareness Board Template

```markdown
# Agent Awareness

- Updated: YYYY-MM-DD HH:MM TZ
- Operator: Human or agent identifier
- Scope: Local private state; do not commit

## Current Focus

- Task: PROJECT-123 or Unassigned
- Summary: Short task description
- Repository: org/repo or local path
- Branch: branch-name
- State: in-progress
- Next: The next concrete action

## Active Tasks

### PROJECT-123 - Short title

- State: in-progress | paused | ready
- Last update: YYYY-MM-DD HH:MM TZ
- Repository: org/repo
- Branch: branch-name
- Done:
  - Concrete completed item
- Next:
  - Concrete next action
- Blockers:
  - None
- Evidence:
  - File paths, command results, commit hashes, PR links

## Blocked Tasks

### PROJECT-456 - Short title

- Blocked by: Missing approval, failing dependency, access issue
- Since: YYYY-MM-DD HH:MM TZ
- Needed to unblock: Specific action or decision
- Evidence:
  - Link or command output

## Waiting On User

- PROJECT-789: Decision needed

## Parking Lot

- Idea or follow-up that should not interrupt current work

## End-of-Day Candidates

- PROJECT-123: Summary candidate with evidence
```

## Daily Worklog Template

The daily worklog is append-only. Corrections are new entries.

```markdown
# Daily Worklog - YYYY-MM-DD

## Entries

### HH:MM - PROJECT-123 - Short action summary

- Context: Repository, branch, workspace, or meeting context
- State: started | in-progress | paused | blocked | done
- Changes: What changed or was decided
- Evidence: Paths, command outputs, test results, commit hashes, PR links
- Next: Optional next action
```

## End-of-Day Summary Template

```markdown
# End-of-Day Summary - YYYY-MM-DD

## By Task

### PROJECT-123 - Short title

- Time window: HH:MM-HH:MM
- Work performed:
  - Concrete outcome
- Evidence:
  - PR, commit, command result, file path, deployment link
- Remaining:
  - Next action or blocker
- Suggested external worklog:
  - Human-reviewed text for Jira or another system

## Unassigned Work

- Work that should be linked to an external ID later

## Blockers

- Task, blocker, owner, next checkpoint

## Methodology Observations

- Anything that made the awareness or worklog process better or worse
```

## Privacy Guardrails

- Do not commit real worklogs, awareness boards, or memory files.
- Do not store secrets, tokens, customer data, or private credentials in these files.
- Do not use the awareness board as a long-term archive.
- Prefer links or redacted evidence when a command output contains sensitive data.
- Review generated end-of-day summaries before posting externally.
