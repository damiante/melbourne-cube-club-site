# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static **Jekyll** site (no client-side JS) for Melbourne Cube Club (MCC), a Magic: The Gathering **Cube** drafting group. Hosted on **GitHub Pages**. Visual style is a deliberate retro 16-bit console-RPG title screen.

## Commands

```bash
bundle exec jekyll serve      # preview at localhost:4000 (bundle install first time)
jekyll build                  # → _site/ (gitignored build output; never edit by hand)
```
On this machine `jekyll` isn't on PATH globally; prefix with
`export PATH="/var/home/linuxbrew/.linuxbrew/lib/ruby/gems/4.0.0/bin:$PATH"`.

Visual QA: Python **Playwright** + Chromium are installed. Serve `_site/` (`python3 -m http.server`) and screenshot desktop + mobile before considering any CSS change done — `file://` won't work because internal URLs are root-absolute (`| relative_url`). There are no tests/linters.

## Content model (the point of the structure)

Non-technical edits are confined to three inputs, each commented inline:
- **`_config.yml`** — `title`, `tagline`, hero `intro`, `discord_url`, `locale`.
- **`_data/sessions.yml`** — a YAML *list* of events; each has `name`, `day`, `time`, `venue.{name,url}`, `signup_url`, `note`. Rendered by the Sessions list on the home page. **`signup_url` empty → the Sign up button falls back to `site.discord_url`** (Liquid `default` + empty-string guard in `index.html`).
- **`about.md` / `tournament.md`** — page prose (Markdown body under front matter).

## Rendering / layout chain

- `_layouts/default.html` — shared shell: `<head>`, sticky banner + nav, footer. Every page renders through it via `{{ content }}`. Nav active state = `page.url contains '/about'` etc.
- `_layouts/page.html` (`layout: default`) — wraps a page's Markdown in the section + RPG "window"; reads front matter `title`, `eyebrow`, `badge`.
- `index.html` (`layout: default`) — home page = hero + Sessions loop over `site.data.sessions`. It's **HTML, not Markdown** (the layout is structural); **there is no `index.md`**.
- `about.md`, `tournament.md` (`layout: page`) — served at `/about/`, `/tournament/` (`permalink: pretty`). Tournament is a "Coming soon" placeholder for a future feature.
- All internal links/assets use the `| relative_url` filter so `baseurl` works.

## Design system (`assets/css/style.css`) — non-obvious rules

- Tokens in `:root`: cobalt `--night`, molten `--gold`/`--orange`/`--red`, `--parchment` text, `--ink` outline. CRT background = dot-grid + scanlines + gradient on `body`.
- Fonts (Google Fonts): **Press Start 2P** (headings/labels/buttons, used sparingly), **VT323** (body).
- **Molten headings (`.molten`)**: gradient clipped to text (`-webkit-background-clip:text` + transparent fill); outline drawn via **`-webkit-text-stroke` + `paint-order: stroke fill`**. ⚠️ Do NOT switch the outline to `text-shadow` — with a transparent fill the shadow bleeds through and the glyphs render solid dark. Stroke width is in `em` to stay proportional (small screens otherwise swallow the letters).
- **No idle animations** — intentional (owner requirement). Hover/focus feedback only; no blink/float/spin. Keep `prefers-reduced-motion` honored.
- **Sessions** are a 3-column CSS grid with a **fixed first column** (`clamp(160px,20vw,220px)`) so every row's details align regardless of day/name length; collapses to one column ≤640px. Sign up = `.btn--primary`, the primary action.
- Responsive banner wraps to two rows ≤720px; brand collapses to "MCC" ≤420px.

## Deployment / gotchas

- GitHub Pages, **legacy branch deploy from `main`** — pushing to `main` auto-builds and deploys. The deploy step occasionally fails/stalls with "try again later" (GitHub-side transient), not a code problem.
- Site is served at a **project path** (`damiantesta.com/melbourne-cube-club-site/`), so `baseurl: "/melbourne-cube-club-site"` in `_config.yml` is required for assets/links to resolve — currently commented out; set it before relying on the live deploy.
- `node_modules/`, `package*.json` are local tooling only — gitignored **and** in `_config.yml` `exclude`. The branding PNGs in the repo root are also build-excluded.
