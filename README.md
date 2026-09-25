# No Limitz Window Tinting: preview site

Preview site for No Limitz Window Tinting, 265 E Merritt Island Cswy, Unit 113, Merritt Island, FL 32952 · (407) 663-3401. Prepared by Blocpod. Not the official site until the owner buys it.

Live preview: https://no-limitz-window-tint.vercel.app (auto-deploys from `main`).

## Stack
Static HTML/CSS/JS. No build step, no framework.

- `index.html`: all content, inline SVG drawings, JSON-LD structured data
- `styles.css`: design tokens and layout
- `main.js`: shade card, open/closed status (America/New_York), reveals, sandboxed quote form, gallery filter and photo viewer, preview notice (about 12 KB)
- `work/`: 12 job photos from the shop's own Facebook page, WebP at 480/800/1080 wide
- `og.jpg`: 1200x630 share image for texts and social posts
- `sitemap.xml`: the page plus image entries for every job photo
- `llms.txt`: plain summary of the business for AI assistants and answer engines
- `fonts/`: self-hosted Schibsted Grotesk (variable) and Geist Mono, SIL Open Font License
- `tools/go-live.py`: flips the preview to the live site (not deployed, see `.vercelignore`)

## Preview mode (current)
Search engines are told to skip the site three ways: `<meta name="robots" content="noindex, nofollow">`, `robots.txt` (`Disallow: /`) and an `X-Robots-Tag` header in `vercel.json`. The quote form has no action and sends nothing.

## Search and AI-engine setup (built in)
- JSON-LD `@graph`: LocalBusiness (AutomotiveBusiness + HomeAndConstructionBusiness) with address, geo, hours, phone, map link, sameAs (Facebook, Google Maps, Yelp), services catalog (brand: American Standard Window Films), plus WebSite, WebPage, ImageGallery and FAQPage.
- Visible FAQ that matches the FAQPage markup word for word (AI answer engines quote this).
- Title, description, Open Graph and Twitter tags; geo meta; descriptive alt text and file names on every photo.
- No review or rating markup on purpose: Google does not allow a business to mark up its own Google reviews.

## Going live
Only after the owner has bought the site and the domain points at Vercel:

```bash
python3 tools/go-live.py https://www.theirdomain.com
```

That swaps the base URL everywhere, turns indexing on, adds the canonical, opens `robots.txt` to search and AI crawlers with the sitemap, drops the noindex header and removes the preview notice. It then prints the off-site steps that matter most for ranking: point the Google Business Profile website at the domain, submit the sitemap in Google Search Console and Bing Webmaster Tools, claim Apple Business Connect, and set the same name, address and phone on Facebook, Yelp and the tint directories. The quote form stays a demo until the owner says where leads should go.

## Content rules
Only verified facts: hours, services, the Google rating (4.6, 47 reviews), exact review snippets, the Florida tint guide (Fla. Stat. 316.2953/316.2954), and the owner's own details from 2026-09-25 (American Standard Window Films, boats, heavy equipment, residential, medical exemptions, family owned, owner operated, 38 years). No prices, warranties, performance stats or service areas beyond Merritt Island until the owner confirms them.
