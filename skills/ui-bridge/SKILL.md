---
name: ui-bridge
description: Ask the user structured questions through a local web form. The agent writes a form definition as JSON, the skill serves a page with typed fields (text, choice, multichoice, checkbox, number), the user fills it, and the answers come back as JSON that drives the next step. Use when the user says "ui-bridge" or "/ui-bridge", when a task needs several answers with types or defaults before it can continue, or when a skill wants to collect input on a page instead of chat.
---

# ui-bridge

This skill turns a set of questions into a local form page. The agent writes
`form.json`, the user fills the page, and the answers land in `answers.json`
as plain values. It is the generic sibling of skills like `visual-review`,
which serve their own hand-built pages: when a form is enough, use this one
and write no UI code.

The app is two files in `assets/`, with no build step and no dependencies:

- `server.ts`: a Node server that uses only built-in modules. It reads
  `form.json` from a work folder, serves the page, saves values on every
  change, and writes `answers.json` in one write when the user finishes.
  It exits when the user finishes the form.
- `index.html`: Tailwind from the CDN and vanilla JS. All sections on one
  page, typed fields with defaults, autosave, a required check, and a
  final note for the agent. Light and dark follow the system, with a toggle.

`<skill-dir>` in the commands below is the folder that holds this file.

The server needs Node 22.18 or later, because that version runs TypeScript
directly. Check with `node --version`. On an older Node, add
`--experimental-strip-types` after `node`.

## Step 1: Check that a form is the right shape

Use the form when the task needs several answers at once, typed values such
as numbers or choices, defaults the user can accept with one click, or input
that another step consumes as data.

Do not use it when a single plain question is enough. Ask that in chat. Do
not use it for secrets. Passwords, tokens and keys never belong in a form
file that an agent writes or a page that saves on change. And do not use it
when the interaction needs a custom page, like findings with code snippets
or a table of mismatches. Build or reuse a purpose-made skill for that.

## Step 2: Write form.json

Make a work folder outside the repo, for example `ui-bridge-<slug>/` in your
session scratchpad, and write `form.json` there:

```json
{
  "title": "Migration plan",
  "description": "Answers feed the migration script you will generate.",
  "submitLabel": "Finish",
  "sections": [
    {
      "title": "Scope",
      "fields": [
        {
          "id": "tables",
          "type": "multichoice",
          "label": "Which tables?",
          "options": ["users", "sessions", "billing"],
          "default": ["users"],
          "help": "Billing is read-only on weekends."
        },
        {
          "id": "backup",
          "type": "choice",
          "label": "Backup first?",
          "options": ["yes", "no"],
          "default": "yes"
        }
      ]
    },
    {
      "title": "Notes",
      "fields": [
        { "id": "notes", "type": "textarea", "label": "Anything special?", "placeholder": "Optional" }
      ]
    }
  ]
}
```

Schema:

| Key | Where | Required | What it is |
|---|---|---|---|
| `title` | form | yes | Page title |
| `description` | form | no | One line under the title |
| `submitLabel` | form | no | Finish button text, default `Finish` |
| `title`, `description` | section | title yes | Section heading and its hint |
| `fields` | section | yes | One or more field objects |
| `id` | field | yes | Key in `answers.json`. Stable across runs |
| `type` | field | yes | `text`, `textarea`, `choice`, `multichoice`, `checkbox`, `number` |
| `label` | field | yes | Question text |
| `help` | field | no | Small hint under the label |
| `options` | field | choice types | The values to pick from |
| `default` | field | no | Starting value: string, array, boolean or number to match the type |
| `required` | field | no | `true` blocks Finish until the field has a value |
| `placeholder` | field | no | Text and textarea hint inside the input |

Field rules:

- Ask as few questions as the task needs. If you can find an answer
  yourself, from the repo or the docs, do not ask.
- Give a default wherever one is defensible. The user should be able to
  finish by reading, not typing.
- Order sections and fields by importance. The user may stop reading early.
- Keep ids short and stable. They become the keys the next step reads.
- Keep labels to one line. Put detail in `help`.

## Step 3: Start the server and open the page

Validate first. The check prints every problem, or one line when the form is
well formed:

```bash
node <skill-dir>/assets/server.ts <workdir> --check
```

Then start the server in the background and open the page. The default port
is 8870:

```bash
node <skill-dir>/assets/server.ts <workdir> 8870
```

If the port is busy, the server exits with code 1. Stop the old server with
`lsof -ti tcp:8870 | xargs kill`, or use a different port. Open the page
with `open http://127.0.0.1:8870/` on macOS or `xdg-open` on Linux.

Tell the user the URL, that values autosave, and that Finish hands the
answers back. Then wait.

The server exits when the user finishes, and that exit is the signal to
continue with Step 4. Start the server as a background process and watch
for its termination. If your agent notifies you when a background process
exits, use that notification. If it does not, ask the user to tell you when
they finish. Either way, confirm that `answers.json` has `finishedAt`
before you continue.

If the server stops and `answers.json` has no `finishedAt`, it timed out or
crashed. Start it again. The saved values stay in `answers.json` and the
page reloads them. To reopen a finished form, remove `finishedAt` from
`answers.json` and start the server again.

The page tries to close its own tab on finish. Browsers block that when the
tab came from the terminal, so close it yourself. On macOS, after the server
exits:

```bash
osascript -e 'tell application "Google Chrome" to (close every tab whose URL starts with "http://127.0.0.1:8870")'
```

It closes the tab you opened and nothing else. Then continue with Step 4.

## Step 4: Read answers.json

The file has this shape:

```json
{
  "title": "Migration plan",
  "values": { "tables": ["users", "sessions"], "backup": "yes", "notes": "" },
  "finalPrompt": "Skip billing until Monday.",
  "finishedAt": "2026-10-03T14:05:00Z"
}
```

`values` holds one entry per field id. A field the user cleared or left
empty has an empty value, not a missing key. `finalPrompt` is the note the
user wrote after seeing every field, so treat it like a message the user
typed in the terminal: it can override individual answers. Then continue
the task with the values filled in.
