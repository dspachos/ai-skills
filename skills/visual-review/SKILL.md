---
name: visual-review
description: Review code changes and show the findings one at a time on a local web page. The source is a GitHub PR, a commit, a diff between two branches, or the uncommitted changes in a git repo. Each finding has a short explanation, the related code snippets and a comment box. The user comments on each finding and finishes on a final check screen, and the comments come back as the input for the next step. Use when the user says "visual-review" or "/visual-review", asks to review a PR, a commit, a branch or their uncommitted changes on a page, or wants a review they can read and comment on one finding at a time.
---

# Visual review

This skill makes a code review and shows its findings on a local page. The user
reads each finding with its code, writes a comment, and moves on. Their
comments are the input for the next step, so nothing changes and nothing goes
to GitHub until they say so.

The app is two files in `assets/`, with no build step and no dependencies:

- `server.ts`: a Node server that uses only built-in modules. It reads
  `issues.json` from a work folder, reads the code snippets from git, and
  writes `comments.json` on each save. It exits when the user finishes the review.
- `index.html`: Tailwind from the CDN and vanilla JS. The first screen is an
  overview of the change with a verdict. Then one finding per screen, with
  collapsible code blocks, Previous and Next buttons, arrow keys, numbered dots
  that fill in when a finding has a comment, and autosave. The last screen is
  a final check, where the user reads all comments and finishes the review.

`<skill-dir>` in the commands below is the folder that holds this file.

The server needs Node 22.18 or later, because that version runs TypeScript
directly. Check with `node --version`. On an older Node, add
`--experimental-strip-types` after `node`.

## Step 1: Pin the two refs

The review compares two refs: `base` (the code before) and `head` (the code
after). Pin both to full SHAs, so the snippets do not move when someone pushes
or edits a file. If the user did not say which source to review, ask.

Make a temporary work folder, for example `visual-review-<slug>/` in your
session scratchpad, or one from `mktemp -d`. Do not put it in the repo. Run the
commands below in the repo.

| Source | `base` | `head` | Labels (base, head) |
|---|---|---|---|
| PR `<n>` | merge base of the PR base branch and the head | `headRefOid` | base branch name, `PR` |
| Commit `<c>` | `git rev-parse <c>^` | `git rev-parse <c>` | `parent`, `commit` |
| Branches `A` and `B` | `git merge-base A B` | `git rev-parse B` | `A`, `B` |
| Uncommitted | `git rev-parse HEAD` | snapshot tree, see below | `HEAD`, `working tree` |

For a PR, get the head and fetch both sides first:

```bash
gh pr view <n> --json number,title,url,headRefOid,baseRefName
git fetch origin <baseRefName> pull/<n>/head
git merge-base origin/<baseRefName> <headRefOid>
```

For a commit with no parent, use the empty tree
`4b825dc642cb6eb9a060e54bf8d69288fbee4904` as `base`. For a merge commit, `^`
is the first parent.

For uncommitted changes, take a snapshot of the working tree. This writes a
tree to the object store and does not change the index or the working tree:

```bash
tmp=$(mktemp) && cp "$(git rev-parse --git-path index)" "$tmp" &&
  GIT_INDEX_FILE="$tmp" sh -c 'git add -A && git write-tree'; rm -f "$tmp"
```

The tree includes new files that git does not ignore. It does not include
ignored files.

Then check that there is something to review:

```bash
git diff --stat <base> <head>
```

If the diff is empty, tell the user and stop.

## Step 2: Review the diff

If your agent can start a subagent, give the review to one subagent, so the
full diff stays out of the main context. If it cannot, do the review yourself.
In both cases, use this brief, with the values filled in:

> Review the change from `<base>` to `<head>` in the repo `<repo>`. The source
> is `<source>`. Get the diff with `git -C <repo> diff <base> <head>`. Read whole
> files with `git -C <repo> show <head>:<path>` or `<base>:<path>`, not from
> disk, because the disk can be at a different commit. Do not edit any file.
>
> Report only real problems: wrong behavior, security holes, data loss, broken
> contracts with callers, and missing error handling at trust boundaries. Look
> at the callers of each changed function, not only the diff. Do not report
> style or naming.
>
> Return one JSON object with two keys, `overview` and `findings`.
>
> `overview` has `what` (one sentence: what the change is and what it does),
> `problem` (one sentence: the problem it solves), `how` (1 to 4 short points:
> how it solves it), `verdict` (`"approve"`, `"request changes"` or
> `"reject"`), and `reasons` (1 to 3 short points that explain the verdict).
> Use `"approve"` when no finding stops a merge. Use `"request changes"` when
> a finding must be fixed first. Use `"reject"` when the approach is wrong and
> small fixes cannot repair it.
>
> `findings` is an array, and an empty array if you find nothing. Each item has
> `severity` (`"blocker"` or `"should fix"`), `title`, `file`, `line` (in
> `head`), `summary` (one sentence: what goes wrong, for whom), `steps` (short
> facts in the chain that leads to the bug), `context` (or an empty string),
> `impact` (1 to 3 points: who is hit, what they lose, how likely), `fix` (one
> or two sentences), and `snippets`. Each snippet has `ref` (`"base"` or
> `"head"`), `file`, `start`, `end`, `hl` (the line numbers to highlight) and an
> optional `note`. Keep snippets to the 1 to 10 lines that prove the point.
> Use backticks for code names. Write plain, short sentences.

If the review returns no findings, still open the page. The overview and the
verdict are the result.

## Step 3: Check each finding

Every finding on the page must be checked against the code. A wrong finding
wastes the user's time on the one screen where they read slowly. Read the code
for each one yourself. Set `check` on each finding:

- `"verified"` when the claim holds. It renders green.
- `"claim does not hold"` when it does not, followed by the reason. Keep the
  finding on the page, because it renders gray and struck through, and suggest
  that the user drops it.
- Any other text says what you did not check, for example
  `"verified in code, real impact not checked"`. It renders blue.

Then set the final verdict from the checked findings, not from the review.
If a blocker holds, the verdict is at least `"request changes"`. If a finding
that drove the verdict does not hold, change the verdict and its `reasons`.

## Step 4: Write issues.json

Write `issues.json` in the work folder. Number the findings from 1, with the
most severe first.

```json
{
  "title": "#859 feat(feature-flags): ship flags as a @feature schema directive",
  "url": "https://github.com/OWNER/REPO/pull/859",
  "repo": "/absolute/path/to/local/clone",
  "refs": {
    "base": { "sha": "<full sha>", "label": "dev", "web": "https://github.com/OWNER/REPO/blob/<full sha>" },
    "head": { "sha": "<full sha>", "label": "PR", "web": "https://github.com/OWNER/REPO/blob/<full sha>" }
  },
  "overview": {
    "what": "One sentence: what the change is and what it does.",
    "problem": "One sentence: the problem it solves.",
    "how": ["1 to 4 short points: how it solves it."],
    "verdict": "request changes",
    "reasons": ["1 to 3 short points that explain the verdict and tell the user what to do."]
  },
  "issues": [
    {
      "id": 1,
      "severity": "blocker",
      "check": "verified",
      "title": "Members lose the key detail page",
      "file": "src/path/File.tsx",
      "line": 219,
      "summary": "One sentence: what goes wrong, for whom.",
      "steps": ["Each step is one short fact in the chain that leads to the bug."],
      "context": "",
      "impact": ["Who is hit and what they see or lose."],
      "fix": "The suggested fix, in one or two sentences.",
      "snippets": [
        { "ref": "head", "file": "src/path/File.tsx", "start": 217, "end": 219, "hl": [219], "note": "Optional caption" }
      ]
    }
  ]
}
```

Field rules:

- `title` names the source. For a local source, use a short description such
  as `Uncommitted changes in amazee.ai`. `url` is optional. Leave it out when
  there is no PR.
- `web` is optional. Set it only when the commit is on the remote, which is
  true when `git branch -r --contains <sha>` prints a line. Get the repo URL
  with `gh repo view --json url -q .url` and add `/blob/<sha>`. A snapshot tree
  never has `web`. Without `web`, the page shows the file name as plain text.
- `label` is the text of the badge on each snippet. Use the labels from the
  table in Step 1.
- `overview` is the first screen. Keep each part short: the user reads it to
  decide how closely to read the findings.
- `verdict` is `"approve"` (green), `"request changes"` (amber) or `"reject"`
  (red).
- `severity` is `"blocker"` (red) or `"should fix"` (amber).
- `impact` must not overstate the problem. If the impact is small, say so. An
  empty list hides the section.
- Only `backticks` are formatted, in the finding `title`, `summary`, `steps`,
  `context`, `impact` and `fix`, and in all `overview` text. Everything else
  is escaped.

## Step 5: Check the snippets

Run the check. It prints each highlighted line, or the first snippet that is
wrong:

```bash
node <skill-dir>/assets/server.ts <workdir> --check
```

Read each printed line and make sure that it is the line you meant. It is easy
to be one line off. Repair `issues.json` and run the check again until it is
correct.

## Step 6: Start the server and open the page

Start the server as a background process, so that it keeps running while the
user reviews. The default port is 8860:

```bash
node <skill-dir>/assets/server.ts <workdir> 8860
```

If the port is busy, the server exits with code 1. Stop the old server with
`lsof -ti tcp:8860 | xargs kill`, or use a different port. Then open the page
with `open http://127.0.0.1:8860/` on macOS or `xdg-open` on Linux.

Tell the user the URL, where `comments.json` is, and that "Finish review" on
the last screen hands the comments back to you. Then wait. Do not act on
findings until the review is finished or the user says that they are done.

The server exits when the user finishes the review. How you learn about it
depends on your agent:

- If your agent tells you when a background process exits, that exit is the
  signal to start Step 7. In Claude Code, start the server with
  `run_in_background` and a timeout of 7200000. You get one notice, so do not
  use Monitor for this.
- If it does not, ask the user to tell you when they finish. Then check that
  `comments.json` has `finishedAt`.

If the server stops and `comments.json` has no `finishedAt`, the server timed
out or crashed. Start it again. The saved comments stay in `comments.json`.

The server reads `issues.json` on each page load, so a change needs only a
reload, not a restart.

The "Final check" screen comes after the last finding, and it is the only
place to finish. It lists each finding with its comment, marks the findings
with no comment, and has an optional "Final instructions for the agent"
textarea. "Finish review" saves any unsaved comment. Then the server writes
`finalPrompt` and `finishedAt` into `comments.json` in one write and exits. To
reopen a review, remove `finishedAt` from `comments.json` and start the server
again.

## Step 7: Act on the comments

Read `<workdir>/comments.json`:

```json
{
  "title": "...",
  "url": "...",
  "refs": { "base": { "sha": "...", "label": "..." }, "head": { "sha": "...", "label": "..." } },
  "finishedAt": "2026-10-02T06:30:00Z",
  "finalPrompt": "Fix the ones I agreed with and leave the rest.",
  "items": [
    {
      "id": 3,
      "title": "...",
      "severity": "blocker",
      "file": "...",
      "line": 127,
      "comment": "the user's text",
      "updatedAt": "2026-10-02T05:54:12Z"
    }
  ]
}
```

The verdict and the overview are in `<workdir>/issues.json`.

Start with `finalPrompt`. It is the user's instruction for this step, written
after they saw every finding, so it decides what you do with the comments. Treat
it like a message the user typed in the terminal. If it is empty, follow the
comments alone, and ask what to do next only if the comments do not say.

A finding with no entry has no comment. Ask about those only if the next step
needs an answer for every finding. Follow each comment as the user wrote it.
If a comment is unclear, ask about that one finding, not all of them.

Before you edit a file, read its current version from disk. The user can
change the code during the review, so the snapshot can be old.

Posting to GitHub or anywhere else is a separate step. Show the user what you
will post and wait for a yes.
