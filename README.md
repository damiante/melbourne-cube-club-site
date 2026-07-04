# Melbourne Cube Club — website

The landing page for MCC, built as a retro 16-bit title screen. It's a
[Jekyll](https://jekyllrb.com/) site, so **GitHub Pages builds it for you
automatically** — you just edit a couple of plain-text files and push.

---

## The 3 files you'll actually edit

| I want to change… | Edit this file |
| --- | --- |
| Event day / time / venue / link (and add more events) | [`_data/sessions.yml`](_data/sessions.yml) |
| The written copy (headings, paragraphs, the "how a night runs" list) | [`index.md`](index.md) |
| Club name, tagline, and the **Discord invite link** | [`_config.yml`](_config.yml) |

Each file has comments at the top explaining every field. You don't need to
touch anything else.

### ⚠️ Before you go live, set these two links

1. **Discord invite** — in `_config.yml`, replace `discord_url` with your real
   permanent invite (Discord → Server Settings → Invites → create one that never
   expires).
2. **Venue link** — in `_data/sessions.yml`, check the `venue.url` for Plenty of
   Games points where you want (their site, or a Google Maps pin).

### Adding a second (or third) event

In `_data/sessions.yml`, copy a whole `- name:` block, paste it below, and edit
the details. The page adds it to the list automatically — no other changes
needed.

---

## Publishing on GitHub Pages

1. Push this repo to GitHub.
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a
   branch**, pick `main` and `/ (root)`, save.
3. Wait ~1 minute. Your site is live at `https://<username>.github.io/<repo>/`.

If your URL includes the repo name (e.g. `.../melbourne-cube-club-site/`),
uncomment the `baseurl:` line at the bottom of `_config.yml` and set it to
`/melbourne-cube-club-site`. If you use a custom domain, leave `baseurl` blank.

---

## Previewing on your own machine (optional)

You only need this if you want to see changes before pushing.

```bash
bundle install        # first time only
bundle exec jekyll serve
```

Then open <http://localhost:4000>.

---

## Where things live

- `_layouts/home.html` — page structure (title screen, sessions, copy, footer).
- `assets/css/style.css` — all the styling (the pixel/molten theme).
- `assets/img/logo.png` — the MCC logo, also used as the favicon.

Design notes: dithered cobalt "screen", a molten red→orange→gold gradient for
headings (matching the logo), and **Press Start 2P** + **VT323** pixel fonts.
