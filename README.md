# ai-skills

A small collection of agent skills I use and share. Each skill is a plain
folder: a `SKILL.md` with the instructions, plus the scripts and assets it
needs. No build step, no lock-in. Read them, edit them, delete them.

## Skills

| Skill | Command | What it does |
| --- | --- | --- |
| [visual-review](skills/visual-review/) | `/visual-review` | Review a PR, a commit, two branches or your uncommitted changes on a local web page. Comment on each finding; the comments drive the next step. |

## Install

Works with any agent that reads `SKILL.md`: Claude Code, Cursor, Codex,
Copilot, Amp, pi, OpenCode and more.

Install all skills into your project (the CLI asks which agents to target):

```bash
npx skills add dspachos/ai-skills
```

Install one skill, globally:

```bash
npx skills add dspachos/ai-skills --skill visual-review -g
```

Or copy a skill folder by hand into your agent's skills directory, for
example `~/.agents/skills/visual-review/`.

Note: `visual-review` runs a local server through Node and needs Node 22.18
or later.

## Site

The GitHub Pages site lives in [`docs/`](docs/):
<https://dspachos.github.io/ai-skills/>

It is HTML, vanilla JS and Tailwind CSS, with no build step. The skill data
in `docs/skills-data.js` is generated from `skills/` — do not edit it by hand.

## Add a skill (maintainers)

1. Copy the skill folder to `skills/<name>/`.
2. Add the group, icon key and changelog entry in `scripts/site-manifest.json`.
3. Run `node scripts/build-site-data.mjs` to regenerate `docs/skills-data.js`.
4. Add the skill to the table above.
5. Commit.

## License

MIT — see [LICENSE](LICENSE).
