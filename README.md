# No Limitz Window Tinting — preview concept

Speculative preview site for No Limitz Window Tinting, 265 E Merritt Island Cswy, Unit 113, Merritt Island, FL 32952 · (407) 663-3401. Prepared by Blocpod. Not the official site.

## Stack
Static HTML/CSS/JS. No build step, no framework.

- `index.html`: all content and inline SVG illustrations
- `styles.css`: design tokens and layout
- `main.js`: shade card, open/closed status (America/New_York), reveals, sandboxed quote form, dismissible preview notice (about 8 KB)
- `fonts/`: self-hosted Schibsted Grotesk (variable) and Geist Mono, both SIL Open Font License, from Fontsource
- `robots.txt` blocks all crawlers; `<meta name="robots" content="noindex, nofollow">` is in the head; `vercel.json` adds an `X-Robots-Tag: noindex, nofollow` header.

## Deploy
Upload the folder to any static host. On Vercel, `vercel.json` sets the noindex header.

## Sandbox
The quote form has no action and makes no network request. It stores nothing. On submit it validates, then shows a confirmation that says it is a demo and nothing was sent, and gives the shop's phone number.

## Content rules
Uses only verified facts: hours, services, the Google rating (4.6, 47 reviews), exact review snippets, and the general Florida tint guide (Fla. Stat. 316.2953/316.2954). No prices, warranties, film brands, performance stats or certifications.
