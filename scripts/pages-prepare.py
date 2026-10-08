#!/usr/bin/env python3
"""Připraví obsah public/ pro GitHub Pages.

GitHub Pages bez vlastní domény servíruje web v podadresáři
(https://<uzivatel>.github.io/<repozitar>/). Web používá cesty od kořene
("/assets/...", "/kontakt/"), proto je tento skript doplní o prefix.
S vlastní doménou (např. aterint.com) se použije --base / a nic se nemění.

Použití:
    python scripts/pages-prepare.py --base /aterint-web/ --out _site
"""
import argparse, re, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser()
p.add_argument('--base', default='/', help='např. /aterint-web/ nebo / pro vlastní doménu')
p.add_argument('--out', default='_site')
p.add_argument('--cname', default='', help='vlastní doména, např. aterint.com')
a = p.parse_args()

base = '/' + a.base.strip('/') + '/' if a.base.strip('/') else '/'
src, out = ROOT / 'public', ROOT / a.out
if out.exists():
    shutil.rmtree(out)
shutil.copytree(src, out)

# Soubory pro Apache / Cloudflare GitHub Pages ignoruje – nepublikujeme je.
for name in ['.htaccess', '_headers']:
    (out / name).unlink(missing_ok=True)
(out / '.nojekyll').write_text('')
if a.cname:
    (out / 'CNAME').write_text(a.cname.strip() + '\n')

if base != '/':
    prefix = base.rstrip('/')
    attr = re.compile(r'\b(href|src|poster)="/(?!/)')
    css_url = re.compile(r"url\((['\"]?)/(?!/)")
    for f in out.rglob('*'):
        if f.suffix == '.html':
            t = f.read_text()
            f.write_text(attr.sub(lambda m: f'{m.group(1)}="{prefix}/', t))
        elif f.suffix == '.css':
            t = f.read_text()
            f.write_text(css_url.sub(lambda m: f'url({m.group(1)}{prefix}/', t))

print(f'Hotovo: {out} (base {base})')
