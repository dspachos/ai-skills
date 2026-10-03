---
title: Skill Micro UIs: when your agent should stop chatting and open a page
date: 2026-10-03
description: Chat is a great interface for explaining and a poor one for deciding. A micro UI is a small page your skill serves when the task needs your hands and eyes.
---

Chat is a great interface for explaining. It is a poor one for deciding.

Ask an agent to review a pull request and you get the classic wall of text: twelve findings, three code blocks deep, and your eyes glaze over at finding four. The information is there. The interface is wrong. Reading a review is not a conversation. It is an inspection, and inspections want space for the code and room for your judgment.

So I built a skill that changes the interface.

## Skill Micro UIs

A skill is a folder of instructions your coding agent reads. A **micro UI** is a small page the skill serves when the task needs your hands and eyes. You interact. The agent continues.

My skill `visual-review` works like this:

1. **Ask.** A pull request, a commit, two branches, or uncommitted changes.
2. **Verify.** The agent reads the whole diff and checks every finding against the code, so you never waste attention on a claim that does not hold.
3. **Open.** A tiny local server starts and a page appears in your browser. The first screen is the verdict.
4. **Decide.** One finding per screen: what goes wrong, the exact lines that prove it, and a comment box.
5. **Finish.** Your comments land in a JSON file. The agent reads them as its instructions and fixes what you agreed with.

Nothing changes and nothing posts until you say so. The page is local, and the agent waits.

## Why this works

The agent does volume; the page does judgment. The agent reads the entire diff, follows the callers, and never gets tired at finding nine. The page gives each finding layout: the code, the conclusion, and a comment box together, so the finding you read is the only thing on your mind. Chat is one long line of text. **A micro UI has layout, and layout is information.**

The contract between them is boring on purpose: one JSON file in, one JSON file out. Two files total, a small Node server and an HTML page. No build step, no framework.

## Beyond code review

The same shape fits many tasks:

- **Merge conflicts:** one hunk per screen, ours and theirs side by side.
- **CI triage:** real bug, flake, or duplicate, one button each.
- **Reconciliation:** two systems compared, with a repair checkbox next to each mismatch.
- **Specs:** a form the agent generates, instead of a chat interrogation.

The rule of thumb: if the task asks for **many small decisions, side-by-side comparison, or pointing at a spot**, serve a page. One answer? Chat is fine.

Most of these cases share the same plumbing. The next thing I am building is a generic version: the agent writes a form as JSON, a local page renders it, and your answers come back as JSON. **Every skill can open a micro UI for free.**

## Try it

Works with any agent that reads `SKILL.md`: Claude Code, Cursor, Codex, Copilot, Amp, pi.

```
npx skills add dspachos/ai-skills
```

Docs and the full skill list: https://dspachos.github.io/ai-skills/

Your agent reviews. You decide.
