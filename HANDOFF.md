# Angela Ng — angelang.org Handoff for Claude Code

## What this is
A complete personal website for Angela Ng (angelang.org), built in plain HTML/CSS/JS.
Three pages, no frameworks, no build step required. Ready to push to GitHub and deploy on Vercel.

## File structure
```
/
├── index.html        (homepage — 27kb)
├── about.html        (about page — 16kb)
├── contact.html      (contact page — 12kb)
└── images/
    ├── hero-portugal.jpg          (hero banner — Portugal coast)
    ├── folia-water-south-africa.jpg
    ├── mindfulness-room.jpg
    ├── climate-clock.jpg
    ├── cop28-speaking.jpg
    ├── bhutan-sunset.jpg
    ├── norway-forest.jpg          (students hugging trees — about page quote banner)
    ├── headshot-teal.jpg          (SDG pin, arms crossed — contact page banner)
    ├── headshot-white.jpg         (white jacket — about page bio section)
    ├── headshot-cmq.jpg           (CMU-Q headshot — used internally)
    ├── dive-coral.jpg             (ocean carousel slide 1)
    ├── dive-fish-school.jpg       (ocean carousel slide 2)
    ├── dive-manta.jpg             (ocean carousel slide 3)
    ├── dive-shark.jpg             (ocean carousel slide 4)
    └── image-e25abed6.jpg         (fallback/duplicate — safe to keep)
```

## Images already swapped
All base64 embedded images have been replaced with `./images/filename.jpg` references.
The HTML files are lean (12–28kb each). Total image folder is ~2MB.

## ONE THING STILL NEEDED — Formspree form ID
In `contact.html`, find this line:
```
action="https://formspree.io/f/YOUR_FORM_ID"
```
Replace `YOUR_FORM_ID` with Angela's real Formspree form ID.
Steps: go to formspree.io → create free account → new form → point to angela's Gmail → copy the ID.

## Deployment instructions

### Option A: GitHub + Vercel (recommended)
1. Create a new GitHub repo (e.g. `angelang-website`)
2. Push all files maintaining the structure above
3. Go to vercel.com → New Project → Import from GitHub
4. No build settings needed — Vercel will detect static HTML automatically
5. Set output directory to `/` (root)
6. Add custom domain `angelang.org` in Vercel dashboard → Domains
7. Update DNS: point angelang.org nameservers to Vercel's (ns1.vercel-dns.com, ns2.vercel-dns.com)

### Option B: GitHub Pages only
1. Create repo named `angelang.org` (or any name)
2. Push all files
3. Settings → Pages → Source: Deploy from branch → main → / (root)
4. Add custom domain angelang.org

## Design system (for future edits)
- **Fonts**: Fraunces (display serif, Google Fonts) + DM Sans (body, Google Fonts)
- **Colors**:
  - Cream background: `#f4ede3`
  - Paper (alt sections): `#e8dfd0`
  - Ink (text): `#1e1408`
  - Moss green (accent): `#3a5a3c`
  - Dark section bg: `#1c2e1d`
  - Ocean section bg: `#0a1520`
  - Footer: `#100c06`
- **No em dashes** anywhere — use commas or periods
- **Italics** used sparingly — one word per headline maximum
- **Nav**: Home · About · Contact on all inner pages; About · Work · Speaking · Contact on homepage

## Page-by-page notes

### index.html (homepage)
Sections in order:
1. Hero — Portugal coast photo, slow zoom animation, "I go where the problems are. I build what's missing."
2. Manifesto — "The hardest problems live at the boundaries between disciplines"
3. Impact strip — 12 countries · 500+ students · 1st MENA Green Flag · 35 dogs rescued
4. Folia Water story — South Africa photo, field pilots
5. Mindfulness Room story — meditation photo, "Built from scratch. Replicated globally."
6. Green Flag story — climate clock photo, first MENA Green Flag
7. AI for Good — dark moss section, Globe Ethics fellowship badge, 3 cards (AI for Good NYC, Substack, Speaking)
8. Speaking — COP28 photo, workshops/nonprofits description, 4 engagements listed
9. Ocean carousel — 4 dive photos rotating, touch/swipe enabled
10. Press strip — NYT (linked), BBC (linked), CNN (unlinked — no URL), Smithsonian (YouTube), USA Today (linked), NBC News (linked), Green Healthy Places (Spotify)
11. Close CTA — Bhutan sunset photo, "Let's build something that matters"
12. Footer

### about.html
Sections in order:
1. Full-bleed banner — white jacket headshot, "Engineer. Builder. Convergence catalyst."
2. About + What Drives Me — text only (no photo), arc paragraph + what drives me paragraph + roles
3. Norway forest full-bleed — quote "A leader, a dreamer, a doer. Things magically come together when she's around." — CMU Alumni Awards 2017
4. Education — JHU MSPH 2019 + CMU BS 2016 side by side
5. Background — certifications (PMP, EIT, RYT-500, Rescue Diver, ClimateFresk, Terra.do LFA, BlueDot AGI, FTSG Foresight, CPH, ICS) + recognition awards list
6. Close CTA — moss green bar, "Ready to build something that matters?" → Get in touch

### contact.html
1. Full-bleed banner — teal SDG pin headshot, "Let's build something that matters."
2. Two-column: left = contact form (Formspree), right = LinkedIn/AI for Good NYC/Substack links + availability note
3. Footer

## Known issues / to-do
- [ ] Replace `YOUR_FORM_ID` in contact.html with real Formspree ID
- [ ] CNN press link is unlinked (no URL available yet)
- [ ] `image-e25abed6.jpg` is a duplicate of headshot-cmq.jpg — safe to leave or consolidate
- [ ] Consider adding `<meta>` og:image tags for social sharing
- [ ] Consider adding a favicon (angela's initials or SDG pin mark)

## What this site replaces
angelang.org — the old site can be taken down once this is live. Everything worth keeping from the old site is now in these three pages.
