#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
מחולל האתר הסטטי של מבנה דרום
================================
קורא תוכן מ-content/*.json, מרנדר תבניות Jinja2 מ-templates/,
ופולט אתר מוכן לפרסום אל ../docs/ (GitHub Pages).

הרצה:  python3 build.py
דרישות: pip install jinja2
"""
import json
import os
import re
import shutil
import sys
from pathlib import Path
from urllib.parse import quote

from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).resolve().parent          # website/
REPO = ROOT.parent                               # repo root
CONTENT = ROOT / "content"
TEMPLATES = ROOT / "templates"
STATIC = ROOT / "static"
OUT = REPO / "docs"

SITE_URL = "https://www.mivnedarom.co.il"


def load_json(name):
    with open(CONTENT / name, encoding="utf-8") as f:
        return json.load(f)


def main():
    site = load_json("site.json")            # global: nav, footer, contact, org
    pages = load_json("pages.json")          # list of page dicts

    env = Environment(
        loader=FileSystemLoader(TEMPLATES),
        autoescape=select_autoescape(["html"]),
        trim_blocks=True,
        lstrip_blocks=True,
    )
    env.filters["urlquote"] = lambda s: quote(s, safe="/")

    # ---- clean output (keep CNAME if present) ----
    cname = None
    if (OUT / "CNAME").exists():
        cname = (OUT / "CNAME").read_text()
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    if cname:
        (OUT / "CNAME").write_text(cname)
    (OUT / ".nojekyll").write_text("")

    # ---- copy static assets ----
    shutil.copytree(STATIC, OUT / "assets")
    # favicon.ico must live at the site root
    fav = OUT / "assets" / "favicon.ico"
    if fav.exists():
        shutil.move(str(fav), OUT / "favicon.ico")

    # ---- render pages ----
    rendered = []
    for page in pages:
        template = env.get_template(page["template"])
        slug = page["slug"]
        canonical = SITE_URL + "/" if slug == "index" else f"{SITE_URL}/{quote(slug, safe='')}/"
        html = template.render(site=site, page=page, pages=pages, canonical=canonical)
        if slug == "index":
            dest = OUT / "index.html"
        else:
            d = OUT / slug
            d.mkdir(parents=True, exist_ok=True)
            dest = d / "index.html"
        dest.write_text(html, encoding="utf-8")
        rendered.append((slug, canonical, page.get("priority", "0.6"), page.get("changefreq", "monthly")))

    # ---- 404 page ----
    if any(p["slug"] == "404" for p in pages):
        # GitHub Pages serves 404.html from the root
        src = OUT / "404" / "index.html"
        if src.exists():
            shutil.copy(src, OUT / "404.html")
            shutil.rmtree(OUT / "404")

    # ---- sitemap.xml ----
    urls = []
    for slug, canonical, priority, changefreq in rendered:
        if slug in ("404", "פרוייקטים", "מדיניות-פרטיות-2", "קטלוגים-פנל-מבודד"):
            continue
        urls.append(
            f"  <url>\n    <loc>{canonical}</loc>\n"
            f"    <changefreq>{changefreq}</changefreq>\n"
            f"    <priority>{priority}</priority>\n  </url>"
        )
    sitemap = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>\n"
    )
    (OUT / "sitemap.xml").write_text(sitemap, encoding="utf-8")

    # ---- robots.txt ----
    (OUT / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n", encoding="utf-8"
    )

    print(f"בוצע: {len(rendered)} עמודים נבנו אל {OUT}")


if __name__ == "__main__":
    main()
