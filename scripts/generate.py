#!/usr/bin/env python3
"""Generate dependency-free HTML, a secure Worker, and portable static output."""
import argparse, base64, hashlib, html, json, shutil
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
args = argparse.ArgumentParser()
args.add_argument('--origin', default='https://aterint-web-trebic.uzveo.chatgpt.site')
args.add_argument('--production', action='store_true')
options = args.parse_args()
ORIGIN = options.origin.rstrip('/')
assert urlparse(ORIGIN).scheme == 'https' and urlparse(ORIGIN).netloc and not urlparse(ORIGIN).query
OUT = ROOT / 'public'
if OUT.exists(): shutil.rmtree(OUT)
OUT.mkdir()
shutil.copytree(ROOT / 'src/static/assets', OUT / 'assets')
# Only ship the compressed local font, not its source TTF or failed conversions.
for name in ['manrope.ttf', 'manrope.woff2']:
    (OUT / 'assets' / name).unlink(missing_ok=True)
shutil.copy(ROOT / 'FONT-LICENSE.txt', OUT / 'assets/manrope-license.txt')
css = (ROOT / 'src/static/style.css').read_text()
CSS = '/assets/style.' + hashlib.sha256(css.encode()).hexdigest()[:12] + '.css'
(OUT / CSS.lstrip('/')).write_text(css)
motion = (ROOT / 'src/static/motion.js').read_text()
MOTION = '/assets/motion.' + hashlib.sha256(motion.encode()).hexdigest()[:12] + '.js'
(OUT / MOTION.lstrip('/')).write_text(motion)
services = json.loads((ROOT / 'src/services.json').read_text())
E = html.escape
PHONE = '+420 603 702 302'
EMAIL = 'novotny.radek@aterint.com'
ADDRESS = 'Na Kopcích 374, 674 01 Třebíč'
paths = ['/'] + ['/sluzby/' + s['slug'] + '/' for s in services] + ['/soukromi/']
page_security = {}

def url(path): return ORIGIN + path
def link_button(label='Zavolat nám', light=False, mail=False):
    target = 'mailto:' + EMAIL if mail else 'tel:+420603702302'
    return f'<a class="button{" light" if light else ""}" href="{target}">{E(label)} <span aria-hidden="true">→</span></a>'

def brand():
    return '<a class="brand" href="/" aria-label="ATERINT – úvodní stránka"><img src="/assets/flame.svg" width="30" height="34" alt="">ATERINT</a>'

def nav():
    return f'''<a class="skip" href="#obsah">Přejít na obsah</a><header id="zacatek"><nav class="container nav" aria-label="Hlavní navigace">{brand()}<div class="nav-links"><a href="/#sluzby">Služby</a><a href="/#uzitecne">Užitečné informace</a><a href="/#kontakt">Kontaktní údaje</a></div><a class="button" href="/#kontakt">Kontakt <span aria-hidden="true">→</span></a><a class="mobile-contact" href="/#kontakt">Kontakt →</a></nav></header>'''

def contact():
    return f'''<section class="contact" id="kontakt" aria-labelledby="kontakt-nadpis"><div class="contact-gridlines" aria-hidden="true"></div><div class="container contact-inner"><div class="contact-heading"><p class="eyebrow">ATERINT s.r.o. / Přímý kontakt</p><h2 id="kontakt-nadpis" data-text-reveal>Kontaktní<br>údaje<span class="heading-dot">.</span></h2><span class="contact-symbol" aria-hidden="true">↗</span></div><div class="people-contacts"><div data-contact-reveal><span class="contact-index" aria-hidden="true">01 / TELEFON A E-MAIL</span><h3>Radek Novotný</h3><a class="contact-phone" href="tel:+420603702302">{PHONE}<span aria-hidden="true">↗</span></a><a class="contact-email" href="mailto:{EMAIL}">{EMAIL}<span aria-hidden="true">→</span></a></div><div data-contact-reveal><span class="contact-index" aria-hidden="true">02 / TELEFON A E-MAIL</span><h3>Jakub Pažourek</h3><a class="contact-phone" href="tel:+420733712083">+420 733 712 083<span aria-hidden="true">↗</span></a><a class="contact-email" href="mailto:pazourek.jakub@aterint.com">pazourek.jakub@aterint.com<span aria-hidden="true">→</span></a></div></div><div class="contact-lower"><p class="contact-address">Sídlo a provozovna<br><strong>{ADDRESS}</strong></p><a class="quiet-link" href="/#kontakt">Všechny firemní údaje <span aria-hidden="true">→</span></a></div></div></section>'''

def footer():
    return f'''<footer class="dark technical-footer"><div class="container footer"><div class="footer-topline"><span>POŽÁRNÍ OCHRANA / BEZPEČNOST PRÁCE</span><a class="footer-return" href="#zacatek">Zpět na začátek <span aria-hidden="true">↑</span></a></div><div class="footer-directory"><div class="footer-brand-block">{brand()}<p>Požární ochrana<br>a bezpečnost práce.<br>Třebíč a okolí.</p></div><nav class="footer-navigation" aria-label="Navigace v patičce"><a href="/" data-reveal data-sequence="0">Úvod <span>01</span></a><a href="/#sluzby" data-reveal data-sequence="1">Služby <span>02</span></a><a href="/#uzitecne" data-reveal data-sequence="2">Co je dobré vědět <span>03</span></a><a href="/#kontakt" data-reveal data-sequence="3">Kontakt <span>04</span></a></nav><div class="footer-side"><a href="/soukromi/">Soukromí webu ↗</a><p>Na Kopcích 374<br>674 01 Třebíč</p><a href="tel:+420603702302">+420 603 702 302 ↗</a></div></div><div class="footer-signature" aria-label="ATERINT"><span class="signature-outline" aria-hidden="true">ATERINT</span><span class="signature-fill" aria-hidden="true">ATERINT</span><span class="signature-point" aria-hidden="true">+</span></div><div class="footer-register"><div><p class="eyebrow">01 / Společnost</p><p>ATERINT s.r.o.<br>Třebíč · Vysočina</p></div><div class="footer-address"><p class="eyebrow">02 / Sídlo a provozovna</p><address>{ADDRESS}</address></div><div><p class="eyebrow">03 / Fakturační údaje</p><p>IČO 29197635<br>DIČ CZ29197635</p></div><div><p class="eyebrow">04 / Kontakt</p><a href="tel:+420603702302">{PHONE}</a><br><a href="mailto:{EMAIL}">{EMAIL}</a></div></div><div class="footer-bottom"><p>© 2026 ATERINT s.r.o.</p><a href="/soukromi/">Soukromí webu ↗</a></div></div></footer>'''

def faq(items, headline='Co se hodí vědět předem'):
    rows = ''.join(f'<details><summary>{E(q)}</summary><p>{E(a)}</p></details>' for q,a in items)
    return f'<section class="faq-section"><div class="container section faq-layout"><div><p class="eyebrow">Užitečné odpovědi</p><h2>{E(headline)}</h2></div><div class="faq-list">{rows}</div></div></section>'

AREA=[{'@type':'City','name':'Třebíč'},{'@type':'AdministrativeArea','name':'okres Třebíč'},{'@type':'AdministrativeArea','name':'Kraj Vysočina'}]

def business_schema():
    return {'@type':'ProfessionalService','@id':url('/#firma'),'name':'ATERINT s.r.o.','legalName':'Aterint s.r.o.','url':url('/'),'telephone':'+420603702302','email':EMAIL,'contactPoint':[{'@type':'ContactPoint','name':'Radek Novotný','telephone':'+420603702302','email':EMAIL,'contactType':'poptávky služeb'},{'@type':'ContactPoint','name':'Jakub Pažourek','telephone':'+420733712083','email':'pazourek.jakub@aterint.com','contactType':'poptávky služeb'}],'logo':url('/assets/flame.svg'),'image':url('/assets/og-cover.png'),'taxID':'29197635','vatID':'CZ29197635','address':{'@type':'PostalAddress','streetAddress':'Na Kopcích 374','addressLocality':'Třebíč','addressRegion':'Vysočina','postalCode':'674 01','addressCountry':'CZ'},'areaServed':AREA,'knowsAbout':['požární ochrana','bezpečnost a ochrana zdraví při práci','BOZP','revize hasicích přístrojů','kontroly hydrantů','požární ucpávky','evakuační plány','školení požární ochrany','školení BOZP','preventivní požární prohlídky','technik požární ochrany'],'identifier':{'@type':'PropertyValue','propertyID':'IČO','value':'29197635'},'description':'Požární ochrana a BOZP v Třebíči a okolí. Dokumentace, školení, preventivní prohlídky, kontroly a servis hasicích přístrojů a hydrantů, požární ucpávky a vybavení objektů.','hasOfferCatalog':{'@type':'OfferCatalog','name':'Služby ATERINT','itemListElement':[{'@type':'Offer','itemOffered':{'@type':'Service','name':s['name'],'url':url('/sluzby/'+s['slug']+'/')}} for s in services]}}

def write_page(path, title, description, content, faqs=None, service=None, index=True):
    graph=[business_schema(),{'@type':'WebSite','@id':url('/#web'),'name':'ATERINT','url':url('/'),'inLanguage':'cs-CZ','publisher':{'@id':url('/#firma')}},{'@type':'WebPage','@id':url(path+'#stranka'),'url':url(path),'name':title,'description':description,'inLanguage':'cs-CZ','isPartOf':{'@id':url('/#web')},'about':{'@id':url('/#firma')}}]
    if path != '/':
        graph.append({'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'ATERINT','item':url('/')},{'@type':'ListItem','position':2,'name':service['name'] if service else title.split(' | ')[0],'item':url(path)}]})
    if service:
        graph.append({'@type':'Service','@id':url(path+'#sluzba'),'serviceType':service['name'],'name':service['title'],'description':service['lead'],'url':url(path),'provider':{'@id':url('/#firma')},'areaServed':AREA,'audience':{'@type':'BusinessAudience','name':'firmy, obce a provozovatelé objektů'}})
    if faqs:
        graph.append({'@type':'FAQPage','@id':url(path+'#otazky'),'mainEntity':[{'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a}} for q,a in faqs]})
    data=json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    sha=base64.b64encode(hashlib.sha256(data.encode()).digest()).decode()
    csp=f"default-src 'none'; script-src 'self' 'sha256-{sha}'; style-src 'self'; img-src 'self'; font-src 'self'; media-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests"
    page_security[path]=csp
    robots='index,follow,max-image-preview:large' if options.production and index else 'noindex,nofollow'
    result=f'''<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{E(title)}</title><meta name="description" content="{E(description,quote=True)}"><meta name="robots" content="{robots}"><link rel="canonical" href="{url(path)}"><meta name="theme-color" content="#181b1c"><meta name="geo.region" content="CZ-63"><meta name="geo.placename" content="Třebíč"><meta name="author" content="ATERINT s.r.o."><meta property="og:type" content="website"><meta property="og:locale" content="cs_CZ"><meta property="og:site_name" content="ATERINT"><meta property="og:title" content="{E(title,quote=True)}"><meta property="og:description" content="{E(description,quote=True)}"><meta property="og:url" content="{url(path)}"><meta property="og:image" content="{url('/assets/og-cover.png')}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/assets/flame.svg" type="image/svg+xml"><link rel="preload" href="/assets/manrope.woff" as="font" type="font/woff" crossorigin><link rel="stylesheet" href="{CSS}"><script type="application/ld+json">{data}</script></head><body class="{'home-page' if path == '/' else 'inner-page'}">{nav()}<main id="obsah">{content}</main>{footer()}</body></html>'''
    result=result.replace('</head>',f'<script src="{MOTION}" defer></script></head>')
    target=OUT/'404.html' if path=='/404/' else OUT/path.lstrip('/')/'index.html'
    target.parent.mkdir(parents=True,exist_ok=True);target.write_text(result)

service_entries=''
AI_NOTE='Ilustrační obrázek vytvořený pomocí AI'
CHAPTERS=[('Podklady a příprava','office-v1.webp',1280,960),('Kontroly a vybavení','inspection-v1.webp',1280,960),('Realizace a montáže','construction-v1.webp',1280,853)]
for c,(chapter,photo,pw,ph) in enumerate(CHAPTERS):
    pair=''
    for i in (2*c,2*c+1):
        service=services[i]
        items=''.join('<li>'+E(item)+'</li>' for item in service['items'])
        pair+=f'<article class="svc-item" id="sluzba-{i+1}" aria-labelledby="sluzba-{i+1}-nazev"><span class="svc-index" aria-hidden="true">{i+1:02d}</span><h3 class="svc-name" id="sluzba-{i+1}-nazev">{E(service["name"])}</h3><p class="svc-lead">{E(service["short"])}</p><ul class="svc-items">{items}</ul><a class="svc-link" href="/sluzby/{service["slug"]}/">Podrobnosti služby <span aria-hidden="true">↗</span></a></article>'
    service_entries+=f'<div class="svc-chapter"><figure class="svc-band"><div class="svc-band-media"><img src="/assets/media/{photo}" width="{pw}" height="{ph}" alt="" loading="lazy" decoding="async"></div><figcaption class="svc-band-caption"><span class="svc-band-range" aria-hidden="true">{2*c+1:02d}–{2*c+2:02d}</span><span class="svc-band-title">{E(chapter)}</span></figcaption><small class="ai-label">{AI_NOTE}</small></figure><div class="svc-pair">{pair}</div></div>'

HOME_FAQ=[
 ('Kde ATERINT působí?','Sídlo a provozovnu máme v Třebíči, Na Kopcích 374. Požární ochranu a BOZP zajišťujeme pro firmy, obce a další provozy v Třebíči, v okolí a v Kraji Vysočina.'),
 ('Jaké služby v oblasti požární ochrany a BOZP nabízíte?','Zpracováváme dokumentaci PO a BOZP, školíme zaměstnance i vedoucí, provádíme preventivní prohlídky a kontroly, prodáváme a kontrolujeme hasicí přístroje a hydrantové systémy, zhotovujeme požární ucpávky a nátěry a dodáváme bezpečnostní tabulky a vybavení objektů.'),
 ('Zajistíte kontrolu hasicích přístrojů a hydrantů v Třebíči a okolí?','Ano. Zajišťujeme prodej a kontroly hasicích přístrojů, hydrantových systémů, požárních hadic a dalších požárně bezpečnostních zařízení pro provozy v Třebíči a na Vysočině.'),
 ('Zpracujete dokumentaci požární ochrany pro firmu nebo obec?','Ano. Zpracujeme novou i aktualizujeme stávající dokumentaci: směrnice, požární řády, požární poplachové směrnice, evakuační plány a další podklady podle činností a podmínek vašeho objektu.'),
 ('Jak si službu objednat?','Zavolejte na +420 603 702 302 nebo +420 733 712 083, případně napište na novotny.radek@aterint.com. Domluvíme rozsah, termín a potřebné podklady.'),
]
home=(ROOT/'src/home.html').read_text().format(service_entries=service_entries,contact_section=faq(HOME_FAQ,'Časté dotazy')+contact())
write_page('/','Požární ochrana a BOZP Třebíč, Vysočina – revize hasicích přístrojů | ATERINT','ATERINT s.r.o. z Třebíče: požární ochrana a BOZP pro firmy a obce na Vysočině. Dokumentace, školení, preventivní prohlídky, kontroly hasicích přístrojů a hydrantů, požární ucpávky.',home,HOME_FAQ)

def breadcrumbs(name):
    return f'<nav class="container breadcrumbs" aria-label="Drobečková navigace"><ol><li><a href="/">ATERINT</a></li><li aria-current="page">{E(name)}</li></ol></nav>'

for s in services:
    related=''.join(f'<a href="/sluzby/{other["slug"]}/">{other["name"]} →</a>' for other in services if other is not s)
    items=''.join('<li>'+E(item)+'</li>' for item in s['items'])
    body=f'''{breadcrumbs(s['name'])}<section class="dark"><div class="container detail-hero"><div><p class="eyebrow">ATERINT / Třebíč a okolí</p><h1>{s['title']}</h1><p class="lead">{s['lead']}</p><div class="actions">{link_button()}{link_button('Napsat e-mail',True,True)}</div></div><div class="detail-icon"><img src="/assets/{s['icon']}.svg" width="32" height="32" alt=""></div></div></section><section class="detail-content"><div class="container section detail-layout"><article class="article"><h2>Co pro vás zajistíme</h2><p>{s['intro']}</p><ul>{items}</ul><h2>Podklady pro zajištění služby</h2><p>{s['preparation']}</p><h2>Typy objektů</h2><p>{s['audience']}</p><h2>Třebíč a okolí</h2><p>ATERINT s.r.o. sídlí na adrese {ADDRESS}. Pro návštěvu objektu nám sdělte jeho adresu; dostupnost a konkrétní termín služby domluvíme podle rozsahu poptávky.</p></article><aside class="aside"><p class="eyebrow">Kontakt</p><h2>ATERINT s.r.o.</h2><p>Radek Novotný</p>{link_button()}<p><a href="mailto:{EMAIL}">{EMAIL}</a></p><p>{ADDRESS}</p></aside></div></section>{faq(s['faqs'])}<section class="services"><div class="container section"><p class="eyebrow">Související služby</p><h2>Další služby</h2><div class="related">{related}</div></div></section>{contact()}'''
    write_page('/sluzby/'+s['slug']+'/',s['title']+' | ATERINT',s['description'],body,s['faqs'],s)

body=f'''{breadcrumbs('Soukromí webu')}<section class="services"><div class="container section article"><p class="eyebrow">Informace o prezentaci</p><h1>Soukromí webu</h1><h2>Bez reklamních a analytických skriptů</h2><p>Tato webová prezentace nepoužívá vlastní reklamní ani analytické skripty, sledovací pixely nebo externě načítané fonty. Neobsahuje kontaktní formulář. Obsah, obrázky a písmo se načítají ze stejného serveru.</p><h2>Telefon a e-mail</h2><p>Odkazy na telefon a e-mail otevřou příslušnou aplikaci na vašem zařízení. Obsah případné zprávy se neodesílá prostřednictvím tohoto webu. Pro otázky týkající se komunikace kontaktujte ATERINT na <a href="mailto:{EMAIL}">{EMAIL}</a>.</p><h2>Technický provoz</h2><p>Poskytovatel hostingu může pro provoz a zabezpečení služby zpracovávat technické údaje o požadavcích na server. Tato prezentace sama nevytváří vlastní uživatelské účty ani marketingové profily návštěvníků.</p><h2>Provozovatel</h2><p>Aterint s.r.o., {ADDRESS}<br>IČO 29197635</p></div></section>'''
write_page('/soukromi/','Soukromí webu | ATERINT','Informace o technickém provozu webové prezentace ATERINT a přímém kontaktu telefonem nebo e-mailem.',body)
write_page('/404/','Stránka nenalezena | ATERINT','Požadovaná stránka neexistuje. Pokračujte na přehled služeb ATERINT.', '<section class="services"><div class="container not-found"><p class="eyebrow">Chyba 404</p><h1>Tudy cesta nevede.</h1><p>Stránka neexistuje nebo byla přesunuta.</p><div class="actions"><a class="button" href="/">Zpět na úvod →</a><a class="button light" href="/#kontakt">Kontakt</a></div></div></section>',index=False)
robots=('User-agent: *\nAllow: /\n\n'+''.join(f'User-agent: {bot}\nAllow: /\n\n' for bot in ['Googlebot','Bingbot','SeznamBot','GPTBot','OAI-SearchBot','ChatGPT-User','ClaudeBot','Claude-SearchBot','PerplexityBot','Google-Extended','Applebot'])+'Sitemap: '+url('/sitemap.xml')+'\n') if options.production else 'User-agent: *\nDisallow: /\n'
(OUT/'robots.txt').write_text(robots)
BUILD_DATE=__import__('datetime').date.today().isoformat()
llms=['# ATERINT s.r.o.','','> Požární ochrana a BOZP v Třebíči a v Kraji Vysočina. Dokumentace PO a BOZP, školení, preventivní prohlídky a kontroly, prodej a kontroly hasicích přístrojů a hydrantů, požární ucpávky a nátěry, bezpečnostní tabulky a vybavení objektů.','','- Firma: ATERINT s.r.o., IČO 29197635, DIČ CZ29197635','- Sídlo a provozovna: Na Kopcích 374, 674 01 Třebíč','- Oblast působnosti: Třebíč, okres Třebíč, Kraj Vysočina','- Kontakt: Radek Novotný, +420 603 702 302, novotny.radek@aterint.com; Jakub Pažourek, +420 733 712 083, pazourek.jakub@aterint.com','','## Služby','']+[f'- [{sv["name"]}]({url("/sluzby/"+sv["slug"]+"/")}): {sv["short"]}' for sv in services]+['','## Časté dotazy','']+[f'- {q} {a}' for q,a in HOME_FAQ]
(OUT/'llms.txt').write_text('\n'.join(llms)+'\n')
(OUT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+E(url(p))+'</loc><lastmod>'+BUILD_DATE+'</lastmod></url>' for p in paths)+'</urlset>')

# Build a social sharing card using the same local brand font and colors.
from PIL import Image, ImageDraw, ImageFont
im=Image.new('RGB',(1200,630),'#181b1c'); draw=ImageDraw.Draw(im)
font_path=ROOT/'src/static/assets/manrope.ttf'
heading=ImageFont.truetype(str(font_path),70); small=ImageFont.truetype(str(font_path),28)
draw.rectangle((0,0,1200,12),fill='#cd352d'); draw.text((76,80),'ATERINT',font=heading,fill='white')
draw.text((76,242),'Požární ochrana a BOZP',font=heading,fill='white');draw.text((76,358),'Třebíč a okolí',font=small,fill='#ff7667');draw.text((76,508),PHONE+'   |   aterint.com',font=small,fill='#aab0af');im.save(OUT/'assets/og-cover.png',optimize=True)

# Portable static hosting configuration. Worker enforces the same headers dynamically.
(OUT/'_headers').write_text("/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Strict-Transport-Security: max-age=31536000\n"+''.join(p+'\n  Content-Security-Policy: '+c+'\n' for p,c in page_security.items()))
apache='''Options -Indexes
DirectoryIndex index.html
ErrorDocument 404 /404.html
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
</IfModule>
<IfModule mod_headers.c>
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "DENY"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
Header always set Strict-Transport-Security "max-age=31536000"
</IfModule>
'''
apache += f'<IfModule mod_headers.c>\nHeader always set Content-Security-Policy "default-src \'none\'; script-src \'self\' '+ ' '.join("'sha256-"+base64.b64encode(hashlib.sha256(f.read_text().split('<script type="application/ld+json">')[1].split('</script>')[0].encode()).digest()).decode()+"'" for f in sorted(OUT.rglob('*.html'))) + '; style-src \'self\'; img-src \'self\'; font-src \'self\'; media-src \'self\'; connect-src \'none\'; object-src \'none\'; base-uri \'none\'; form-action \'none\'; frame-ancestors \'none\'; upgrade-insecure-requests"\n</IfModule>\n'
(OUT/'.htaccess').write_text(apache)

payload={}
types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.woff':'font/woff','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'}
for f in sorted(OUT.rglob('*')):
    if not f.is_file() or f.name in ['.htaccess','_headers']:continue
    relative=f.relative_to(OUT).as_posix();route='/'+relative
    if relative=='index.html':route='/'
    elif relative.endswith('/index.html'):route='/'+relative[:-10]
    elif relative=='404.html':route='/404/'
    raw=f.read_bytes();payload[route]={'body':base64.b64encode(raw).decode(),'size':len(raw),'type':types[f.suffix],'etag':'"'+hashlib.sha256(raw).hexdigest()[:24]+'"','csp':page_security.get(route)}
worker='const ROUTES='+json.dumps(payload,separators=(',',':'))+';\nconst PREVIEW='+json.dumps(not options.production)+';\n'
worker += '''
function secureHeaders(entry){
 const headers=new Headers({'Content-Type':entry?.type||'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Strict-Transport-Security':'max-age=31536000','Cross-Origin-Resource-Policy':'same-origin','Cache-Control':'no-cache'});
 headers.set('Content-Security-Policy',entry?.csp||"default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
 if(PREVIEW)headers.set('X-Robots-Tag','noindex, nofollow');
 return headers;
}
export default {async fetch(request){
 const parsed=new URL(request.url);let path;
 try{path=decodeURIComponent(parsed.pathname)}catch{return new Response('Neplatná adresa',{status:400,headers:secureHeaders()})}
 if(!['GET','HEAD'].includes(request.method)){const h=secureHeaders();h.set('Allow','GET, HEAD');return new Response('Metoda není podporována',{status:405,headers:h})}
 if(parsed.protocol==='http:'){parsed.protocol='https:';const h=secureHeaders();h.set('Location',parsed.href);return new Response(null,{status:308,headers:h})}
 if(path==='/index.html'){const h=secureHeaders();h.set('Location','/'+parsed.search);return new Response(null,{status:301,headers:h})}
 if(!ROUTES[path]&&ROUTES[path+'/']){const h=secureHeaders();h.set('Location',path+'/'+parsed.search);return new Response(null,{status:301,headers:h})}
 if(path.endsWith('/index.html')&&ROUTES[path.slice(0,-10)]){const h=secureHeaders();h.set('Location',path.slice(0,-10)+parsed.search);return new Response(null,{status:301,headers:h})}
 const found=ROUTES[path];const entry=found||ROUTES['/404/'];const status=!found||path==='/404/'?404:200;const headers=secureHeaders(entry);
 if(status===404)headers.set('X-Robots-Tag','noindex, nofollow');
 if(found){headers.set('ETag',entry.etag);if(path.startsWith('/assets/'))headers.set('Cache-Control',path.includes('/style.')?'public, max-age=31536000, immutable':'public, max-age=86400');
 if(request.headers.get('If-None-Match')===entry.etag)return new Response(null,{status:304,headers});}
 const size=entry.size;headers.set('Content-Length',String(size));
 const video=found&&entry.type==='video/mp4';
 if(video)headers.set('Accept-Ranges','bytes');
 if(request.method==='HEAD')return new Response(null,{status,headers});
 let start=0,end=size-1,responseStatus=status;
 const range=request.headers.get('Range');const ifRange=request.headers.get('If-Range');
 if(video&&range&&(!ifRange||ifRange===entry.etag)){
   const m=/^bytes=(\\d*)-(\\d*)$/.exec(range);
   let valid=!!m&&(m[1]!==''||m[2]!=='');
   if(valid){
     if(m[1]===''){const suffix=Number(m[2]);valid=Number.isSafeInteger(suffix)&&suffix>0;start=Math.max(0,size-suffix)}
     else{start=Number(m[1]);end=m[2]===''?size-1:Number(m[2]);valid=Number.isSafeInteger(start)&&Number.isSafeInteger(end)&&start>=0&&end>=start&&start<size;end=Math.min(end,size-1)}
   }
   if(!valid){headers.set('Content-Range','bytes */'+size);headers.set('Content-Length','0');return new Response(null,{status:416,headers})}
   responseStatus=206;headers.set('Content-Range','bytes '+start+'-'+end+'/'+size);headers.set('Content-Length',String(end-start+1));
 }
 const first=Math.floor(start/3)*4,last=Math.ceil((end+1)/3)*4;
 const decoded=atob(entry.body.slice(first,last));const skip=start-Math.floor(first/4)*3;
 const bytes=new Uint8Array(end-start+1);
 for(let i=0;i<bytes.length;i++)bytes[i]=decoded.charCodeAt(skip+i);
 return new Response(bytes,{status:responseStatus,headers});
}};
'''
(ROOT/'worker').mkdir(exist_ok=True);(ROOT/'worker/index.js').write_text(worker)
(ROOT/'build-info.json').write_text(json.dumps({'origin':ORIGIN,'production':options.production,'pages':paths,'assets':len(payload)-10,'workerBytes':len(worker.encode()),'pageSecurity':page_security},ensure_ascii=False,indent=2))
print(json.dumps({'pages':len(paths),'origin':ORIGIN,'production':options.production,'workerBytes':len(worker.encode())}))
