---
title: Skill Micro UIs: when your agent should stop chatting and open a page
date: 2026-10-03
description: Chat is a great interface for explaining and a poor one for deciding. A micro UI is a small page your skill serves when the task needs your hands and eyes.
---

Chat is a great interface for explaining. It is a poor interface for deciding.

Ask an agent to review a pull request and you get the classic wall of text:
twelve findings, three code blocks deep, and your eyes glaze over at finding
four. The information is there. The interface is wrong. Reading a review is
not a conversation. It is an inspection. Inspections want space for the code
and room for your judgment, one finding at a time.

So I built a skill that changes the interface.

## Skill Micro UIs

A skill is a folder of instructions your coding agent reads. A micro UI is a
small page your skill serves when the task needs your hands and eyes. You
interact. The agent continues.

My skill, `visual-review`, works like this:

1. You ask for a review. A pull request, a commit, two branches, or your
   uncommitted changes.
2. The agent reads the whole diff and writes its findings to a file. It also
   verifies every finding against the code first, so you do not waste
   attention on claims that do not hold.
3. The skill starts a tiny local server and opens a micro UI in your browser.
4. You work through the review like a person, not a terminal. The first
   screen is the verdict. Then one finding per screen: what goes wrong, the
   exact lines that prove it, and a comment box.
5. You press Finish. Your comments land in a JSON file. The server exits.
   The agent picks up your comments as its next instructions and fixes what
   you agreed with.

Nothing changes and nothing posts until you say so. The page is local, and
the agent waits.

![The overview screen: what changed, how, and the verdict](images/verdict.png)

## Why this works

The agent and the page do different jobs, and each does the job it is good
at.

The agent is good at volume. It reads the entire diff, follows the callers,
checks each claim against the code, and never gets tired at finding nine.
I would never do that by hand for every pull request.

The micro UI is good at judgment. A screen is two-dimensional: the code and
the conclusion sit together, one finding fills the page, and a comment box
waits under the code you are commenting on. The finding you are reading is
the only thing on your mind. Chat is one long line of
text. A micro UI has layout, and layout is information.

The contract between them is boring on purpose: one JSON file in, one JSON
file out. The agent writes what it found. The page collects what you decide.
On finish, the file lands back with the agent. That is the whole
integration: two files, a small Node server and an HTML page, with no build
step and no framework.

![One finding per screen, with its code and a comment box](images/finding.png)

## This is bigger than code review

Code review is just the first case where I felt the pain. The same micro
UI shape fits many tasks:

- Resolving merge conflicts, one hunk per screen, ours and theirs side by
  side.
- Triaging failed CI runs: real bug, flake, or duplicate, one button each.
- Checking two systems against each other, with a repair checkbox next to
  each mismatch.
- Any set of questions the agent needs answered before it can continue,
  shown as a real form instead of a chat interrogation.

The rule of thumb: if the task asks you to make many small decisions, or to
compare things side by side, or to point at a specific spot, the interface
should be a micro UI. If the task asks for one answer, chat is fine.

Most of these cases share the same plumbing. So the next thing I am building
is a generic version: the agent writes a form definition as JSON, a local
page renders it, and your answers come back as JSON. Every skill can open a
micro UI for free, and each skill stays a plain folder of instructions that
any agent can read.

## Try it

The skill works with any agent that reads `SKILL.md`: Claude Code, Cursor,
Codex, Copilot, Amp, pi, and friends.

```
npx skills add dspachos/ai-skills
```

Docs and the full skill list: https://dspachos.github.io/ai-skills/

Your agent reviews. You decide.
