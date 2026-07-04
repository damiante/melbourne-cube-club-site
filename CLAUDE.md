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
- `about.md` (`layout: page`) — served at `/about/`.
- `tournament.html` (`layout: default`) — served at `/tournament/`; the interactive Swiss tournament app (see below).
- `default.html` supports per-page `extra_css` / `extra_js` front-matter arrays (loaded via `relative_url`), so JS ships only where needed — the tournament page is the only one with JavaScript.
- All internal links/assets use the `| relative_url` filter so `baseurl` works.

## Tournament app (`assets/js/tournament.js` + `tournament.css`)

Self-contained vanilla-JS Swiss tournament manager, no framework/deps. State lives entirely in `localStorage` (`mcc_tournament_v1`) and persists across reloads until the user resets; a single `render()` rebuilds `#tournament-app` from `state.phase` (`setup` → `round` → `ended`). DOM is built with a small `h()` helper using `textContent` (names are user input — keep it that way, don't switch to innerHTML).
- Seating: player `i` of `N` sits at `angle = i·360/N` clockwise from top, so seats always redistribute evenly.
- Round 1 pairs opposite seats (`i` with `i+N/2`); odd counts give a **random** player the bye.
- Setup list supports drag-to-reorder (Pointer Events, mouse + touch) and rejects duplicate names (case-insensitive).
- Ending a tournament tallies **completed rounds only** — an unfinished current round is excluded from standings and the round count.
- Rounds 2+ = Swiss: match points (win/bye = 3, draw = 1), MTG tiebreakers (OMW%/GW%/OGW%), rematch avoidance via `backtrackPair`, byes to the lowest-standing player with the fewest byes (no second bye until everyone has one). A bye is scored as a **2–1 win**. Game counts per match are not enforced (matches can go to time).

## Design system (`assets/css/style.css`) — non-obvious rules

- Tokens in `:root`: cobalt `--night`, molten `--gold`/`--orange`/`--red`, `--parchment` text, `--ink` outline. CRT background = dot-grid + scanlines + gradient on `body`.
- Fonts (Google Fonts): **Press Start 2P** (headings/labels/buttons, used sparingly), **VT323** (body).
- **Molten headings (`.molten`)**: gradient clipped to text (`-webkit-background-clip:text` + transparent fill); outline drawn via **`-webkit-text-stroke` + `paint-order: stroke fill`**. ⚠️ Do NOT switch the outline to `text-shadow` — with a transparent fill the shadow bleeds through and the glyphs render solid dark. Stroke width is in `em` to stay proportional (small screens otherwise swallow the letters).
- **No idle animations** — intentional (owner requirement). Hover/focus feedback only; no blink/float/spin. Keep `prefers-reduced-motion` honored.
- **Sessions** are a 3-column CSS grid with a **fixed first column** (`clamp(160px,20vw,220px)`) so every row's details align regardless of day/name length; collapses to one column ≤640px. Sign up = `.btn--primary`, the primary action.
- Responsive banner wraps to two rows ≤720px; brand collapses to "MCC" ≤420px.

## Deployment / gotchas

- GitHub Pages, **legacy branch deploy from `main`** — pushing to `main` auto-builds and deploys. The deploy step occasionally fails/stalls with "try again later" (GitHub-side transient), not a code problem.
- Site is served at the custom apex domain **`https://cubeclub.melbourne/`** (set by the `CNAME` file in the repo root, managed by Pages — don't delete it). It's a domain root, so `baseurl` in `_config.yml` stays empty (leave it commented). Internal URLs use `| relative_url` so they resolve regardless.
- `node_modules/`, `package*.json` are local tooling only — gitignored **and** in `_config.yml` `exclude`. The branding PNGs in the repo root are also build-excluded.
