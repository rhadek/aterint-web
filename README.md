# ATERINT — požární ochrana a BOZP

Zdroj návrhu: https://www.figma.com/design/ZDGofHh03CsmHPhUh4SWk6?node-id=3-34

Web má úvodní stránku, šest samostatných stránek služeb, kontakt a technické informace o soukromí. Obsah i kontakt jsou plně použitelné bez JavaScriptu. Lokální skript doplňuje animovaný úvod, reakci ilustrace a světla na myš, parallax, průběh čtení a přehled služeb se sdíleným fotografickým doprovodem a horizontální průchod užitečnými informacemi řízený svislým scrollováním. Není použit žádný externí animační balík. Obsah nikdy trvale neskrývá a respektuje nastavení omezení pohybu. Vektorové podklady jsou přesné exporty schválených vrstev Figmy. Písmo Manrope se načítá lokálně; licence je v `FONT-LICENSE.txt`.

Úvod navazuje přímo na konkrétní nabídku původního aterint.com. Praktické informace vysvětlují dokumentaci, školení, doklady o kontrolách a přístup k požárnímu vybavení. Zdroj základní orientace: https://hzscr.gov.cz/vice-o-statnim-pozarnim-dozoru . Nejsou použity smyšlené recenze či fotografie zaměstnanců.

Úvod včetně navigace a pohyblivého pásu vyplňuje dynamickou výšku obrazovky. Při mimořádně velkém textu se může rozšířit, aby se obsah neořízl. Úvod, služby a patička používají volné posouvání; nejsou dorovnávány na celé obrazovky. Při opouštění úvodu tak zůstává viditelný efekt jeho zmenšování. Krátké odhalení značky nepoužívá falešná procenta načítání a posun stránky jej okamžitě skryje. Automatický pás a dekorativní rotaci lze pozastavit.

Služby tvoří očíslovaný adresář se stále viditelnými názvy a stručnými popisy. Na desktopu je vedle seznamu přichycené fotografické okno; pod 900 px se změní na kompaktní horní pás přichycený pouze v rozsahu této sekce. Tři uživatelem dodané ilustrační snímky sdílejí související dvojice služeb: podklady a školení, kontroly a revize, realizace a vybavení. Při scrollování se snímky jemně prolínají a mění se značka aktuálního řádku. Obrázky jsou označeny jako ilustrační a nejsou vydávány za dokumentární fotografie firmy. Detailní úplné seznamy se rozbalují pouze aktivací nativního `details/summary`; scroll je neotevírá ani nezavírá. Otevření další služby nezavře předchozí. Všechny informace a ruční ovládání fungují bez JavaScriptu. Omezení pohybu odstraňuje prolínání a posun obrázků.

Užitečné informace mají čtyři horizontální kapitoly přes celou šířku obrazovky na mobilu, tabletu i desktopu. Nativní `scroll-snap-type: y proximity` doplňuje dorovnání po skončení gesta (`scrollend` s časovou zálohou). Krátký záměrný posun z dokončené kapitoly přejde na sousední kapitolu; zastavení mezi kapitolami se dorovná. Automatické dorovnání je omezené na rozsah informací a čeká na uvolnění dotyku. Nové gesto nebo navigace na kotvu mohou pohyb přerušit. Na mobilu lze také táhnout vodorovně. Poslední kapitolu lze normálně opustit směrem ke kontaktu. Samostatná video scéna má také svůj snap bod s `scroll-snap-stop: always` a vyplňuje výšku viewportu včetně mobilu. Úvod, služby ani patička snap body nemají. Tlačítka a šipky klávesnice v ovládání informací zůstávají dostupné. Mobil má vlastní jednosloupcovou sazbu uvnitř vodorovných kapitol, nízké okno kompaktní variantu. Pokud zvětšený text přesto přesáhne panel, zůstává posuvný a dostupný klávesnicí. Vypnutý JavaScript a omezené animace mají obsah v běžném toku stránky. Kontakty zůstávají čitelné i během animace; nadpisy se odhalují po slovech. Kolečko myši není zachytáváno.

Kontakty a patička mají odladěné menší typografické měřítko. Mobilní nadpis kontaktů má 34–45 px, telefony 23–29 px a odkazy zachovávají nejméně 44 px vysokou dotykovou plochu. Mobilní patička používá úsporné dva sloupce navigace a firemních údajů.

Video má samostatnou tmavou sekci s jemnou technickou mřížkou, pomalu putujícím měděným světlem a tenkými kruhovými linkami navazujícími na úvod. Drobné popisky uvádějí oblast služeb a označení ilustračního videa. Pohyb pozadí běží jen v záběru, lze jej samostatně pozastavit a respektuje omezení pohybu. Je vystředěné, se zaobleným rámem, teplým podsvícením a tenkou světelnou linkou pod obrazem. Na velkém monitoru má šířku až 1920 px s limitem 86 % výšky viewportu; původní limit byl 1320 px. Poměr stran zůstává 16 : 9 a obraz se neořezává. Začne se přehrávat bez zvuku a ve smyčce, až je alespoň 35 % přehrávače v záběru. Do té doby používá `preload="none"`. Při opuštění obrazovky nebo skrytí záložky se pozastaví. Ruční pozastavení se nepřepisuje a nastavení omezení pohybu automatické přehrávání vypíná. Pokud prohlížeč autoplay odmítne, zůstává dostupné nativní ovládání pro ruční spuštění, zvuk a celou obrazovku.

Film má zachovaných 42 sekund a původní zvukovou stopu; webová kopie má přibližně 1,6 MB, H.264/AAC, 960 × 540. Obrázky jsou lokální WebP, původní podklady se nepřepisují. Média se spolu s ostatními soubory vkládají do Workeru; při nahrávání na Sites nevyžadují externí hosting.

## Spuštění a sestavení

Požadavky: Node.js 22+, Python 3 s Pillow. Žádné npm balíčky ani instalace závislostí nejsou potřeba.

```
python scripts/generate.py
bash scripts/build.sh
node scripts/check-site.mjs
node scripts/check-motion.mjs
node scripts/validate-artifact.mjs
```

Výstup `dist/server/index.js` je samostatný Worker ESM pro Sites. Výstup `public/` je přenosná statická verze pro vlastní hosting. Výchozí sestavení je pracovní verze se zákazem indexace.

## Produkční verze pro aterint.com

```
python scripts/generate.py --production --origin https://aterint.com
node scripts/check-site.mjs
node scripts/check-motion.mjs
bash scripts/build.sh
node scripts/validate-artifact.mjs
```

Pro Apache nahrajte **obsah** `public/` do kořenového adresáře webu, včetně `.htaccess`. Aktivujte HTTPS, `mod_headers` a `mod_rewrite`, ověřte, že server umožňuje pravidla `.htaccess`. Pro jiný server nastavte ekvivalentní HTTP hlavičky, přesměrování a skutečnou odpověď 404. Není potřeba PHP ani databáze. Před nasazením zálohujte současný web a zjistěte jeho používané URL. Jejich vhodná přesměrování je potřeba vytvořit podle skutečného seznamu; v tomto projektu se staré URL nevymýšlejí.

Worker hlavičky nastavuje přímo: Content-Security-Policy s hashem JSON-LD, HSTS bez includeSubDomains, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy a Cross-Origin-Resource-Policy. Podporuje GET/HEAD, ETag/304, skutečné 404 a jednotlivé byte-range požadavky (206/416) pro posouvání ve videu. HSTS zapínejte jen při funkčním HTTPS. U statického hostingu po nasazení ověřte skutečné hlavičky – samotná přítomnost konfiguračního souboru není důkaz aktivní ochrany.

## Co zbývá pro veřejnou dohledatelnost

1. Nasadit produkční verzi na aterint.com a zpřístupnit web bez přihlášení. Pracovní verze na Sites se záměrně neindexuje; aktuální nastavení přístupu spravuje vlastník v Sites.
2. Vybrat jednu hlavní variantu domény, např. https://aterint.com; ostatní varianty přesměrovat jedním 301 na odpovídající URL hlavní domény. DNS, certifikát a přesměrování vyžadují přístup ke skutečnému hostingu/doméně.
3. Založit nebo ověřit doménovou službu v Google Search Console a odeslat https://aterint.com/sitemap.xml. Ověřit hlavní stránku a stránky služeb v URL Inspection, Rich Results Test a PageSpeed Insights.
4. Aktualizovat skutečný Google Business Profile a Firmy.cz: přesný název firmy, telefon, web a adresa Na Kopcích 374, Třebíč. Ve veřejných katalozích se objevují i starší adresy; sjednotit je. Otevírací dobu, fotky, kategorie a oblasti působnosti doplnit jen podle skutečnosti.
5. Získávat autentické zákaznické recenze a aktuální fotografie práce; žádné smyšlené reference nebo hodnocení nejsou v tomto webu použity.
6. Po nasazení sledovat dotazy a indexaci v Search Console. Výsledky a AI doporučení nejsou zaručené a změny se neprojevují okamžitě.

## SEO a vyhledávání pomocí AI

Veřejné produkční HTML má jedinečné title/description, jeden H1, přímé interní odkazy, canonical URL, český jazyk, Open Graph, sitemap a robots.txt. JSON-LD obsahuje LocalBusiness, WebSite, WebPage, Service, BreadcrumbList a otázky shodné s viditelným obsahem. FAQ schema samo o sobě běžné firmě nezaručuje FAQ výpis ve výsledcích. Nejsou vytvořeny duplicitní stránky pro okolní obce, smyšlené pobočky ani domnělé certifikace.

Google uvádí, že pro AI Overviews/AI Mode nejsou nutné zvláštní AI soubory či speciální schema. Rozhoduje kvalitní dostupný obsah a obvyklé SEO zásady:
https://developers.google.com/search/docs/appearance/ai-features
https://developers.google.com/search/docs/appearance/structured-data/local-business

## Úpravy obsahu

Služby: `src/services.json`. Šablony, kontakty a schema: `scripts/generate.py`. Vzhled: `src/static/style.css`. Úvod: `src/home.html`. Pohyb: `src/static/motion.js`. Po změně znovu sestavte a ověřte projekt. Pokud se změní telefon, adresa či služby, upravte viditelný obsah i schema společně.

## Ověření a omezení

Kontroly pohybu ověřují svislé i vodorovné posouvání, tlačítka, klávesnici, reakci na ukazatel, pozastavení a přechod do běžného přehledu. Automatické kontroly pokrývají všechny stránky, odkazy a soubory, metadata, schema, CSP hashe, odpovědi 404/405/HEAD/304, HTTPS redirect a indexační režim. V tomto prostředí nebyla dostupná podporovaná infrastruktura pro browser QA; skutečný vzhled v prohlížeči, Lighthouse a hlavičky vlastního hostingu je nutné ověřit po nasazení. Není provedeno penetrační testování ani udělována záruka absolutní bezpečnosti. Web neobsahuje analytiku, formuláře, aplikační cookies ani vlastní uživatelské účty; soukromé přihlášení a provozní logy hostingu jsou mimo tuto prezentaci.

Homepage content revision (7 October 2026): the catalogue now reflects the concrete service and equipment lists retrieved from http://aterint.com/ on that date, with spelling corrections. Both named business contacts are included. The old site's separate Vítězslava Nezvala operating address is superseded by the user's explicit instruction that the registered and operating address is Na Kopcích 374. The recommendation narrative and first-conversation section were removed. No opening hours or new credentials were invented.


Design reference pass: public pages spykercars.com, residences.loamhouse.com.au and havu.cc/en were inspected as motion/layout references following the user request. No reference-site imagery, video, logos or source implementation was copied. The user-provided screenshots guided the full-screen sizing and footer. The approved hero illustration remains the existing ATERINT design asset. On 7 October the user supplied five AI-generated images and an illustrated promotional film. The images are labelled as illustrations and are not represented as documentary company photographs. Media provenance and web derivatives are recorded in MEDIA-SOURCES.md.
