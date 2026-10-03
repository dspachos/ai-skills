# AGENTS.md

Guidelines for AI agents working in this repository.

## What this repo is

A collection of agent skills shared through GitHub, plus the GitHub Pages
site that presents them. Live site: https://dspachos.github.io/ai-skills/

## Layout

- `skills/<name>/SKILL.md` — the skill exactly as agents install it. Copy
  skills unchanged. Do not reformat or restyle them.
- `scripts/site-manifest.json` — per-skill site metadata: group, tagline,
  icon, requires, examples, lead, diagram.
- `scripts/build-site-data.mjs` — regenerates `docs/skills-data.js` from
  `skills/` and the manifest.
- `docs/` — the site: `index.html`, `skill.html`, `changelog.html`,
  `app.js`, `skills-data.js` (generated), `assets/`.

## Adding a skill

1. Copy the skill folder to `skills/<name>/`.
2. Add an entry to `scripts/site-manifest.json`: group, tagline, icon key,
   requires, examples, and optionally lead and diagram.
3. Run `node scripts/build-site-data.mjs`.
4. Add the skill to the table in `README.md`.
5. Add a changelog entry in the manifest.
6. Commit.

## Site rules

- Plain HTML, vanilla JS, Tailwind CSS from the CDN. No build step, no
  framework, no npm install.
- Never edit `docs/skills-data.js` by hand. It is generated.
- The design tokens (colors, fonts, radius) live in the
  `<style type="text/tailwindcss">` block of each page. Keep the three
  pages identical. The palette follows aihero.dev/skills: amber accent
  `#f5c451`, DM Sans, JetBrains Mono, 9px radius.
- Dark theme is the default. A stored toggle choice wins over the default.
- Icons are inline SVG path maps (`STROKE`, `FILL`) in `docs/app.js`. An
  icon key from the manifest must exist there.
- Diagrams are hand-written SVG files in `docs/assets/`. They use the page
  CSS variables, so they follow the theme. The generator embeds them into
  `skills-data.js`.
- The SKILL.md section on a skill page shows the raw markdown source in a
  `<details>` element, closed by default.
- Site copy is plain English: short sentences, no idioms.

## Git

- Conventional Commits (`feat`, `fix`, `docs`, `chore`), one concern per
  commit.
- Never force push `main`. No AI attribution lines in commits or PRs.
- Commit locally. Push to `origin main` when the user asks.
