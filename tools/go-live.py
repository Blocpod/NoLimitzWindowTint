#!/usr/bin/env python3
"""Turn the No Limitz preview into the live, indexable site.

Run this only after the owner has bought the site and the domain points at Vercel:

    python3 tools/go-live.py https://www.example.com

It swaps the preview base URL for the live domain (canonical, Open Graph, JSON-LD,
sitemap, llms.txt), turns indexing on, opens robots.txt to search and AI crawlers,
drops the noindex header from vercel.json and removes the "preview concept" pill.
The quote form stays sandboxed: wiring it to the shop is a separate, approved step.
"""
import json
import pathlib
import re
import sys

PREVIEW = "https://no-limitz-window-tint.vercel.app"
ROOT = pathlib.Path(__file__).resolve().parent.parent

ROBOTS = """User-agent: *
Allow: /

# Search and AI answer engines are welcome to read and cite this site.
User-agent: Googlebot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bingbot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Applebot
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: {live}/sitemap.xml
"""

NEXT_STEPS = """
Done. Commit and push, then:
  1. Google Business Profile: set Website to {live}/ (it points at Facebook today). Add the
     services (boats, heavy equipment, fleet, residential, commercial) and upload the job photos.
  2. Google Search Console: verify the domain, submit {live}/sitemap.xml, request indexing.
  3. Bing Webmaster Tools (feeds Copilot and ChatGPT search): import from Search Console, submit the sitemap.
  4. Apple Business Connect: claim the listing so Apple Maps and Siri show the website.
  5. Facebook, Yelp, Birdeye, TintBrokers, TintFinder: set the website field. Keep name, address
     and phone identical everywhere: No Limitz Window Tinting, 265 E Merritt Island Cswy, Unit 113,
     Merritt Island, FL 32952, (407) 663-3401.
  6. Wire the quote form to the shop (it is still a sandboxed demo) once the owner says where leads go.
  7. Re-test: https://search.google.com/test/rich-results and https://validator.schema.org
"""


def main() -> None:
    if len(sys.argv) != 2 or not sys.argv[1].startswith("https://"):
        sys.exit("usage: python3 tools/go-live.py https://www.example.com")
    live = sys.argv[1].rstrip("/")

    for name in ("index.html", "sitemap.xml", "llms.txt"):
        path = ROOT / name
        path.write_text(path.read_text().replace(PREVIEW, live))

    index = ROOT / "index.html"
    html = index.read_text()
    html = re.sub(r"<!-- PREVIEW:.*?-->\n", "", html)
    html = html.replace(
        '<meta name="robots" content="noindex, nofollow">',
        '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">\n'
        f'<link rel="canonical" href="{live}/">',
    )
    html = re.sub(r'\n<aside class="pill".*?</aside>\n', "\n", html, flags=re.S)
    index.write_text(html)

    (ROOT / "robots.txt").write_text(ROBOTS.format(live=live))

    vercel = ROOT / "vercel.json"
    config = json.loads(vercel.read_text())
    for rule in config.get("headers", []):
        rule["headers"] = [h for h in rule["headers"] if h["key"].lower() != "x-robots-tag"]
    config["headers"] = [r for r in config.get("headers", []) if r["headers"]]
    vercel.write_text(json.dumps(config, indent=2) + "\n")

    print(NEXT_STEPS.format(live=live))


if __name__ == "__main__":
    main()
