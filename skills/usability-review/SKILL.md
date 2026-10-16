---
name: usability-review
description: Check an app's interface against Jakob Nielsen's ten usability heuristics and show the findings on a local web page. The user comments on each finding, and the comments drive the fixes. Use when the user says "usability review" or "/usability-review", asks for a heuristic evaluation or a usability check of an app, site, screen or flow, or wants their UI checked against the ten heuristics.
---

# Usability review

This skill checks a user interface against the ten usability heuristics of
Jakob Nielsen (Nielsen Norman Group) and shows each finding on a local page.
The user reads each finding with a screenshot, writes a comment, and moves on.
Their comments are the input for the fixes, so nothing changes until the user
finishes the review.

The app is two files in `assets/`, with no build step and no dependencies:

- `server.ts`: a Node server that uses only built-in modules. It reads
  `findings.json` from a work folder, serves the page and the screenshots,
  and writes `comments.json` on each save. It exits when the user finishes
  the review.
- `index.html`: Tailwind from the CDN and vanilla JS. The first screen is an
  overview with the verdict and a coverage table of all ten heuristics. Then
  one finding per screen, with the screenshot, the comment box, Previous and
  Next buttons, arrow keys, and numbered dots that fill in when a finding has
  a comment. The last screen is a final check, where the user reads all
  comments and finishes the review.

`<skill-dir>` in the commands below is the folder that holds this file.

The server needs Node 22.18 or later, because that version runs TypeScript
directly. Check with `node --version`. On an older Node, add
`--experimental-strip-types` after `node`.

## The ten heuristics

1. **Visibility of system status.** The system tells the user what happens,
   with feedback in good time.
2. **Match between system and the real world.** The system speaks the user's
   language, with familiar words, phrases and concepts.
3. **User control and freedom.** Users can undo and redo. "Emergency exits"
   exist for wrong paths.
4. **Consistency and standards.** Words, situations and actions mean the same
   thing everywhere. Platform conventions hold.
5. **Error prevention.** The design stops errors before they happen.
6. **Recognition rather than recall.** The user sees options and choices.
   The user does not have to remember information from another screen.
7. **Flexibility and efficiency of use.** Shortcuts serve both new and
   expert users.
8. **Aesthetic and minimalist design.** The interface holds no irrelevant or
   rarely needed information.
9. **Help users recognize, diagnose and recover from errors.** Error
   messages are clear, plain, and show the fix.
10. **Help and documentation.** Help is easy to search, focused on the task,
    and short.

## Step 1: Pin the target and gather the evidence

A heuristic evaluation needs the real interface, not a description of it.
Decide with the user what to review: the whole app, a flow such as checkout,
or single screens. If the user did not say, ask.

Make a new work folder that only this review uses:
`usability-review-<slug>/` in a scratchpad that belongs to your session, or
`mktemp -d -t usability-review`. Never use a fixed path such as
`/tmp/usability-review`. Two sessions on the same folder overwrite each
other's comments. Do not put the folder in the app's repo. Keep its path,
because Step 7 reads `comments.json` from it.

Fill the work folder with one screenshot per screen, named after the screen,
for example `checkout-step1.png` or `dashboard-dark.png`. Get them this way:

| Situation | How to get the evidence |
|---|---|
| The user sends screenshots | Save each one into the work folder. Ask for missing screens that the key flows need. |
| Public URL, and you have a browser or screenshot tool | Capture the key screens yourself, including empty states, errors and dialogs where you can reach them. |
| You have neither | Ask the user for screenshots. A review of the UI code alone is the fallback. If you use it, say so in `overview.scope`. |

Ask the user for anything the screenshots cannot show: timing of feedback,
keyboard navigation, animations, what happens after a submit. Name those
limits in `overview.scope`.

## Step 2: Evaluate the interface

If your agent can start a subagent, give the evaluation to one subagent, so
the screenshots stay out of the main context. If it cannot, do the evaluation
yourself. In both cases, use this brief, with the values filled in:

> Review the screenshots in `<workdir>` against the ten usability heuristics
> of Jakob Nielsen. The target is `<app and version or URL>`, the focus is
> `<whole app, or the flows the user named>`. Look at every screenshot. For
> each heuristic, ask where the interface breaks it for a real user, not for
> an expert. Trace the flows screen by screen: what the user must remember
> between screens, what feedback each action gives, what happens on an error.
>
> Report only real problems that a user meets in these screens: missing
> feedback, unfamiliar words, no undo, inconsistent labels or placement,
> errors the design invites, memory load, no shortcuts, clutter that hides
> the task, unclear error messages, missing help. Do not report taste, brand
> choices, or accessibility issues that the heuristics do not cover. Every
> finding needs evidence you can point at: a screenshot or the exact visible
> text.
>
> Return one JSON object with three keys, `overview`, `coverage` and `issues`.
>
> `overview` has `what` (one sentence: the state of the interface), `scope`
> (one sentence: what the evidence covers and what it does not), `verdict`
> (`"pass"`, `"needs fixes"` or `"needs redesign"`), and `reasons` (1 to 3
> short points that explain the verdict). Use `"pass"` when no finding blocks
> or stalls a user. Use `"needs fixes"` when users meet friction they should
> not. Use `"needs redesign"` when a flow or a screen must change as a whole.
>
> `coverage` is an array with one entry per heuristic, 1 to 10. Each entry
> has `heuristic`, `status` (`"checked"`, `"limited"` or `"not checked"`)
> and an optional `note` that says what limited it. Use `"limited"` when the
> screenshots cannot show the whole picture, for example timing feedback on a
> static image. Use `"not checked"` only when you saw no evidence at all for
> that heuristic.
>
> `issues` is an array, and an empty array if you find nothing. Each item
> has `severity` (`"blocker"`, `"should fix"` or `"polish"`), `heuristic`
> (1 to 10), `title` (short, names the problem), `where` (the screen or flow,
> as the user calls it), `summary` (one sentence: what the user runs into),
> `why` (one or two sentences: how it breaks the named heuristic), `impact`
> (1 to 3 points: who is hit and what it costs them), `fix` (one or two
> sentences: the smallest change that repairs it), and `evidence`. Each
> evidence item has either `image` (a file name in the work folder) or `text`
> (the exact visible wording, quoted), and an optional `note`.
>
> Severity: `"blocker"` when users fail, get stuck, or lose work. `"should
> fix"` when users slow down, hesitate, or make recoverable mistakes.
> `"polish"` when a small inconsistency or clutter remains. Use plain, short
> sentences. Use backticks for UI labels and code names.

If the evaluation returns no findings, still open the page. The overview,
the verdict and the coverage table are the result.

## Step 3: Check each finding

Every finding on the page must be checked against the evidence. A wrong
finding wastes the user's time on the one screen where they read slowly.
Open each screenshot again and read each finding yourself. Set `check` on
each finding:

- `"verified"` when the screenshot or the quoted text shows the problem. It
  renders green.
- `"claim does not hold"` when it does not, followed by the reason. Keep the
  finding on the page, because it renders gray and struck through, and
  suggest that the user drops it.
- Any other text says what you did not check, for example
  `"visible in the screenshot, real flow not checked"`. It renders blue.

Then set the final verdict from the checked findings, not from the
evaluation. If a blocker holds, the verdict is at least `"needs fixes"`. If
a finding that drove the verdict does not hold, change the verdict and its
`reasons`.

## Step 4: Write findings.json

Write `findings.json` in the work folder. Number the findings from 1, with
the most severe first.

```json
{
  "title": "Checkout flow, shop.example.com",
  "url": "https://shop.example.com/checkout",
  "target": "The three checkout screens, mobile viewport, dark theme.",
  "overview": {
    "what": "The flow works, but every step asks the user to remember the previous one.",
    "scope": "Three screenshots from desktop. Mobile, errors after submit and timing were not checked.",
    "verdict": "needs fixes",
    "reasons": [
      "Two blockers make users lose their input.",
      "Most findings sit in heuristic 6, memory load."
    ]
  },
  "coverage": [
    { "heuristic": 1, "status": "limited", "note": "static images, timing not visible" },
    { "heuristic": 2, "status": "checked" },
    { "heuristic": 3, "status": "checked" },
    { "heuristic": 4, "status": "checked" },
    { "heuristic": 5, "status": "checked" },
    { "heuristic": 6, "status": "checked" },
    { "heuristic": 7, "status": "not checked", "note": "no keyboard or repeat use visible" },
    { "heuristic": 8, "status": "checked" },
    { "heuristic": 9, "status": "limited", "note": "no error state in the screenshots" },
    { "heuristic": 10, "status": "not checked", "note": "help pages not captured" }
  ],
  "issues": [
    {
      "id": 1,
      "severity": "blocker",
      "check": "verified",
      "heuristic": 3,
      "title": "No way back from the review step",
      "where": "Checkout, step 3",
      "summary": "Users who spot a wrong address on the review screen must start over.",
      "why": "The review step has no back control, so the user has no emergency exit from a wrong path.",
      "impact": ["Users lose their cart contents and retype the address."],
      "fix": "Add a `Back` link to step 2 that keeps the entered values.",
      "evidence": [
        { "image": "checkout-step3.png", "note": "No back control; the browser back button clears the form." }
      ]
    }
  ]
}
```

Field rules:

- `title` names the target. `url` is optional. Leave it out when the app has
  no public URL.
- `target` says what was reviewed in one line. It is the first thing the user
  reads after the title.
- `overview.scope` must name every limit from Step 1. The user decides how
  much to trust the review from it.
- `coverage` must list each heuristic 1 to 10 exactly once, even when the
  status is `"not checked"`. The overview screen renders the whole table.
- `verdict` is `"pass"` (green), `"needs fixes"` (amber) or
  `"needs redesign"` (red).
- `severity` is `"blocker"` (red), `"should fix"` (amber) or `"polish"`
  (blue).
- `image` is a plain file name in the work folder, never a path. `png`,
  `jpg`, `webp` and `gif` are allowed.
- `impact` must not overstate the problem. If the impact is small, say so. An
  empty list hides the section.
- Only `backticks` are formatted, in `title`, `summary`, `why`, `impact`,
  `fix`, `evidence` text and notes, and all `overview` text. Everything else
  is escaped.

## Step 5: Check the findings

Run the check. It prints one line per finding, plus every coverage gap:

```bash
node <skill-dir>/assets/server.ts <workdir> --check
```

Read each printed line and make sure the images named there are the ones you
meant. Repair `findings.json` and run the check again until it is correct.

## Step 6: Start the server and open the page

Start the server detached, so it survives the command that launched it:

```bash
nohup node <skill-dir>/assets/server.ts <workdir> > <workdir>/server.log 2>&1 &
echo $! > <workdir>/server.pid
```

The server uses the first free port from 8880 to 8889, and writes its URL to
`<workdir>/url`. Do not stop a process that holds one of these ports. It can
be an open review from another session.

Wait for the URL, then open the page:

```bash
for i in $(seq 50); do [ -s <workdir>/url ] && break; sleep 0.2; done
open "$(cat <workdir>/url)"
```

Use `xdg-open` in place of `open` on Linux. If `<workdir>/url` does not
appear, the server did not start. Its log names the problem, for example all
ten ports busy, or a review that already runs in this folder. In the second
case, make a new work folder. Do not stop the other server.

Tell the user the URL, where `comments.json` is, and that "Finish review" on
the last screen hands the comments back to you. Then wait. Do not act on
findings until the review is finished or the user says that they are done.

The server exits when the user finishes the review. How you learn about it
depends on your agent:

- If your agent tells you when a background process exits, that exit is the
  signal to start Step 7. In Claude Code, start the server with
  `run_in_background` and a timeout of 7200000. You get one notice, so do not
  use Monitor for this.
- If your shell commands can block a turn, wait on the PID:

```bash
while kill -0 "$(cat <workdir>/server.pid)" 2>/dev/null; do sleep 1; done
```

- If neither works, poll `comments.json` for `finishedAt` every few seconds,
  and ask the user to tell you when they finish.

If the server stops and `comments.json` has no `finishedAt`, the server timed
out or crashed. Start it again. The saved comments stay in `comments.json`.
To reopen a review, remove `finishedAt` from `comments.json` and start the
server again.

## Step 7: Act on the comments

Read `<workdir>/comments.json`:

```json
{
  "title": "Checkout flow, shop.example.com",
  "url": "https://shop.example.com/checkout",
  "finishedAt": "2026-10-16T09:12:00Z",
  "finalPrompt": "Fix the ones I agreed with and leave the rest.",
  "items": [
    {
      "id": 1,
      "title": "No way back from the review step",
      "heuristic": 3,
      "severity": "blocker",
      "where": "Checkout, step 3",
      "comment": "Agreed. Keep it on the same page if you can.",
      "updatedAt": "2026-10-16T09:05:41Z"
    }
  ]
}
```

The verdict and the overview are in `<workdir>/findings.json`.

Start with `finalPrompt`. It is the user's instruction for this step, written
after they saw every finding, so it decides what you do with the comments.
Treat it like a message the user typed in the terminal. If it is empty,
follow the comments alone, and ask what to do next only if the comments do
not say.

A finding with no entry has no comment. Ask about those only if the next
step needs an answer for every finding. Follow each comment as the user wrote
it. If a comment is unclear, ask about that one finding, not all of them.

Before you edit a file, read its current version from disk. The user can
change the code during the review, so the screenshots can be old. When two
findings pull the same screen in different directions, say so and ask which
one wins.

The fix loop can repeat. After the fixes, offer to re-run the review on the
changed screens and open the page again.
