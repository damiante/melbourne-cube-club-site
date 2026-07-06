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
| Organisers — name, photo, Discord handle, and bio (add/remove people) | [`_data/organisers.yml`](_data/organisers.yml) |
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

## Organisers (the "Meet your Organisers" page)

Each person in [`_data/organisers.yml`](_data/organisers.yml) becomes a card with
their photo, name, Discord handle, and a short bio.

**Adding a photo:** drop the image file into
[`assets/img/organisers/`](assets/img/organisers/) and point the `photo:` field
at it (e.g. `/assets/img/organisers/alex.jpg`). Photos are served through GitHub
Pages' CDN — **not** hotlinked from the raw repo — so they load fast and don't
hit GitHub's rate limit. Every photo is shown at the **same square size** and
cropped to fit, so they look uniform even if your originals differ slightly; a
roughly square image (~400×400px or bigger) works best. Leave `photo:` blank
(`""`) and a placeholder silhouette shows instead.

**Linking a Discord profile:** fill in `discord_id` with the person's numeric
Discord user ID and their handle becomes a link to their profile. Leave it blank
and the handle just shows as plain text. To get an ID: turn on Discord's
Developer Mode (Settings ▸ Advanced), then right-click a user ▸ **Copy User ID**.

**Add another organiser:** copy a whole `- name:` block, paste it below, and edit
the details.

---

## Pages

- **Home** — hero + the Sessions list ([`index.html`](index.html)).
- **`/about/`** — About Cube, from [`about.md`](about.md).
- **`/organisers/`** — Meet your Organisers ([`organisers.html`](organisers.html)),
  from [`_data/organisers.yml`](_data/organisers.yml).
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
a commit and it goes live in about a minute at <https://cubeclub.melbourne/>.

The custom domain is set by the `CNAME` file in the repo root (managed by
GitHub Pages — leave it in place). Because the site lives at the domain root,
the `baseurl:` line in [`_config.yml`](_config.yml) stays **empty** (keep it
commented out). Only set `baseurl` if you ever move to a repo sub-path such as
`username.github.io/melbourne-cube-club-site/`.

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
