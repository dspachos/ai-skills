# ai-skills

<https://dspachos.github.io/ai-skills/>

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

## License

MIT — see [LICENSE](LICENSE).
