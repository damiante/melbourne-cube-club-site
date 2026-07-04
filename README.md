# Melbourne Cube Club — website

The site for MCC, built as a retro 16-bit title screen. It's a
[Jekyll](https://jekyllrb.com/) site, so **GitHub Pages rebuilds it for you
automatically** whenever you push — you just edit a few plain-text files.

---

## What you'll edit

| I want to change… | Edit this file |
| --- | --- |
| Club name, tagline, hero intro, and the **Discord link** | [`_config.yml`](_config.yml) |
| Sessions — day, time, venue, and the **Sign up** link (and add more events) | [`_data/sessions.yml`](_data/sessions.yml) |
| The **About Cube** page text | [`about.md`](about.md) |
| The **Run Tournament** page text | [`tournament.md`](tournament.md) |

Every one of these files has comments at the top explaining each field. You
don't need to touch anything else.

---

## Sessions (the list on the home page)

Each event in [`_data/sessions.yml`](_data/sessions.yml) becomes a card showing
the day, time, a **venue link**, and a big **Sign up** button — the main thing
you want people to click.

Two links per session:

- **`venue.url`** — where the venue name points (a Google Maps pin, the shop's
  site, etc.).
- **`signup_url`** — where the **Sign up** button goes (a Discord event, a
  form…). **Leave it blank (`""`) and the button falls back to your Discord
  invite**, so it always works.

**Add another event:** copy a whole `- name:` block, paste it below, and edit
the details. The home page adds it to the list automatically.

---

## Pages

- **Home** — hero + the Sessions list ([`index.html`](index.html)).
- **`/about/`** — About Cube, from [`about.md`](about.md).
- **`/tournament/`** — Run Tournament ([`tournament.html`](tournament.html)): a
  built-in **Swiss tournament** manager. Add players, seat them around a virtual
  table, and run rounds — pairings, byes, results, and final standings are all
  handled for you. It runs entirely in your browser (nothing is uploaded, no
  sign-up), and the tournament survives a page refresh until you end or reset
  it.

The links in the top banner point to these. Editing the Markdown only changes
the words — the layout, banner, and footer are handled for you.

---

## Publishing

The site is already connected to GitHub Pages and **deploys from `main`**: push
a commit and it goes live in about a minute at
<https://damiantesta.com/melbourne-cube-club-site/>.

Because it lives at that sub-path (`/melbourne-cube-club-site/`), the
`baseurl:` line at the bottom of [`_config.yml`](_config.yml) must be set to
`/melbourne-cube-club-site` so the styling, logo, and links resolve. (If you
ever move it to its own domain or subdomain, clear `baseurl` again.)

If a deploy ever fails with *"try again later"*, that's a temporary GitHub
hiccup, not your content — re-run the deployment (repo **Actions** tab → the
failed run → **Re-run all jobs**) or just push again.

---

## Previewing on your own machine (optional)

Only needed if you want to see changes before pushing:

```bash
bundle install        # first time only
bundle exec jekyll serve
```

Then open <http://localhost:4000>.

---

## Where things live (for the curious)

- `_layouts/default.html` — the shared shell: sticky banner, nav, footer.
- `_layouts/page.html` — wraps the About / Tournament text in a styled box.
- `index.html` — the home page (hero + sessions).
- `assets/css/style.css` — all the styling (the pixel / molten theme).
- `assets/img/logo.png` — the MCC logo, also used as the favicon.

Design notes: a dithered cobalt "CRT screen", a molten red→orange→gold gradient
for headings (matching the logo), and **Press Start 2P** + **VT323** pixel
fonts. It's deliberately static — no blinking or animation.
