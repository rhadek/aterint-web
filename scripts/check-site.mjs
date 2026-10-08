import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import worker from '../worker/index.js';
const info=JSON.parse(await readFile(new URL('../build-info.json',import.meta.url),'utf8'));
let count=0;
const req=(path,options={})=>worker.fetch(new Request(info.origin+path,options));
for(const path of info.pages){
 const response=await req(path);assert.equal(response.status,200,path);
 const body=await response.text();assert.equal((body.match(/<h1[ >]/g)||[]).length,1,path+' one H1');
 assert.match(body,/<html lang="cs">/);assert.match(body,/<meta name="description" content="[^"]+">/);
 assert.ok(body.includes('<link rel="canonical" href="'+info.origin+path+'">'));
 assert.ok(!/<form[ >]/i.test(body));assert.ok(!body.includes('www.figma.com/api/'));
 assert.equal((body.match(/<script/g)||[]).length,2);
 assert.match(body,/<script src="\/assets\/motion\.[a-f0-9]+\.js" defer><\/script>/);
 const data=body.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)[1];
 const schema=JSON.parse(data);const firm=schema['@graph'].find(x=>['LocalBusiness','ProfessionalService'].includes(x['@type']));
 assert.equal(firm.address.streetAddress,'Na Kopcích 374');assert.equal(firm.telephone,'+420603702302');
 const hash=createHash('sha256').update(data).digest('base64');
 assert.ok(response.headers.get('Content-Security-Policy').includes("'sha256-"+hash+"'"));
 assert.ok(response.headers.get('Content-Security-Policy').includes("frame-ancestors 'none'"));
 assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');assert.equal(response.headers.get('X-Frame-Options'),'DENY');
 if(info.production){assert.ok(!body.includes('content="noindex,nofollow"'));assert.equal(response.headers.get('X-Robots-Tag'),null)}
 else{assert.ok(body.includes('content="noindex,nofollow"'));assert.equal(response.headers.get('X-Robots-Tag'),'noindex, nofollow')}
 for(const match of body.matchAll(/(?:href|src)="(\/[^"]*)"/g)){
  const target=match[1].split('#')[0];if(!target)continue;assert.equal((await req(target)).status,200,path+' → '+target);count++;
 }
 const etag=response.headers.get('ETag');assert.ok(etag);assert.equal((await req(path,{headers:{'If-None-Match':etag}})).status,304);
 const head=await req(path,{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
}
const miss=await req('/stranka-ktera-neexistuje/');assert.equal(miss.status,404);assert.equal(miss.headers.get('X-Robots-Tag'),'noindex, nofollow');
assert.equal((await req('/',{method:'POST',body:'x'})).status,405);
assert.equal((await req('/index.html')).status,301);
assert.equal((await req('/sluzby/revize-hasicich-pristroju-hydrantu-trebic')).status,301);
assert.equal((await worker.fetch(new Request('http://aterint.example/'))).status,308);
assert.equal((await req('/%ZZ')).status,400);
assert.equal((await req('/assets/neznamy.svg')).status,404);
const robot=await (await req('/robots.txt')).text();assert.ok(robot.includes(info.production?'Allow: /':'Disallow: /'));
const sitemap=await (await req('/sitemap.xml')).text();for(const path of info.pages)assert.ok(sitemap.includes('<loc>'+info.origin+path+'</loc>'));
const assets=['flame','extinguisher','doc','people','shield','ext','wall','sign'];
for(const name of assets){const res=await req('/assets/'+name+'.svg');const s=await res.text();assert.equal(res.headers.get('Content-Type'),'image/svg+xml');assert.match(s,/<svg[ >]/);assert.match(s,/width="\d+/);assert.match(s,/height="\d+/);assert.ok(s.length>200);assert.ok(!s.includes('<script'));}
const font=await req('/assets/manrope.woff2');assert.ok((await font.arrayBuffer()).byteLength>20000);assert.equal(font.headers.get('Content-Type'),'font/woff2');
const og=await req('/assets/og-cover.png');assert.equal(og.headers.get('Content-Type'),'image/png');assert.ok((await og.arrayBuffer()).byteLength>10000);
// Video seeking must return the actual requested bytes, including unaligned base64 boundaries.
const filmPath='/assets/media/aterint-film-v1.mp4';
const originalFilm=await readFile(new URL('../src/static/assets/media/aterint-film-v1.mp4',import.meta.url));
const filmHead=await req(filmPath,{method:'HEAD'});
assert.equal(filmHead.headers.get('Content-Type'),'video/mp4');assert.equal(filmHead.headers.get('Accept-Ranges'),'bytes');
assert.equal(Number(filmHead.headers.get('Content-Length')),originalFilm.length);assert.equal(await filmHead.text(),'');
for(const [range,start,end] of [['bytes=0-63',0,63],['bytes=1-37',1,37],['bytes=2-82',2,82],['bytes=-29',originalFilm.length-29,originalFilm.length-1],['bytes=1500000-',1500000,originalFilm.length-1],['bytes=1572400-9999999',1572400,originalFilm.length-1]]){
 const r=await req(filmPath,{headers:{Range:range}});assert.equal(r.status,206,range);
 assert.equal(r.headers.get('Content-Range'),`bytes ${start}-${end}/${originalFilm.length}`);
 assert.equal(Number(r.headers.get('Content-Length')),end-start+1);
 assert.deepEqual(Buffer.from(await r.arrayBuffer()),originalFilm.subarray(start,end+1),range);
}
for(const range of ['bytes=-0','bytes=-','bytes=80-20','bytes=9999999-','bytes=0-1,3-4']){
 const r=await req(filmPath,{headers:{Range:range}});assert.equal(r.status,416);assert.equal(r.headers.get('Content-Range'),'bytes */'+originalFilm.length);assert.equal(await r.text(),'');
}
const unchanged=await req(filmPath,{headers:{Range:'bytes=0-9','If-Range':filmHead.headers.get('ETag')}});assert.equal(unchanged.status,206);
const changedFilm=await req(filmPath,{headers:{Range:'bytes=0-9','If-Range':'"obsolete"'}});assert.equal(changedFilm.status,200);assert.equal(Number(changedFilm.headers.get('Content-Length')),originalFilm.length);
for(const name of ['construction','inspection','office','workshop']){
 const image=await req('/assets/media/'+name+'-v1.webp');assert.equal(image.headers.get('Content-Type'),'image/webp');assert.ok((await image.arrayBuffer()).byteLength>10000);
}
const htmls=[];async function walk(dir){for(const n of await readdir(dir)){const p=join(dir,n);if((await stat(p)).isDirectory())await walk(p);else if(n.endsWith('.html'))htmls.push(await readFile(p,'utf8'));}}
await walk(fileURLToPath(new URL('../public',import.meta.url)));const titles=htmls.map(h=>h.match(/<title>(.*?)<\/title>/)[1]);assert.equal(new Set(titles).size,titles.length);
assert.ok((await readFile(new URL('../src/static/style.css',import.meta.url),'utf8')).includes('@media(max-width:680px)'));
const homepage=await (await req('/')).text();assert.ok(homepage.includes('Co zajišťujeme'));assert.ok(homepage.includes('Požární zasklení') || homepage.includes('požárního zasklení'));assert.ok(homepage.includes('Jakub Pažourek'));assert.ok(!homepage.includes('Doteď hlavně'));assert.ok(!homepage.includes('Co nám říct'));assert.ok(!homepage.includes('Začněme domluvou'));assert.ok(!homepage.includes('Na co se nás často ptáte'));
assert.match(homepage,/<video controls muted loop playsinline preload="none" data-ambient-video/);assert.ok(!homepage.includes('film-copy'));assert.ok(!homepage.includes('service-observatory'));assert.equal((homepage.match(/class="svc-item"/g)||[]).length,6);assert.equal((homepage.match(/class="ai-label"/g)||[]).length,3);assert.ok(!homepage.includes('services-visual'));const serviceSection=homepage.split('id="sluzby"')[1].split('</section>')[0];assert.equal((serviceSection.match(/class="svc-band"/g)||[]).length,3);assert.equal((serviceSection.match(/class="svc-lead/g)||[]).length,6);assert.ok(!serviceSection.includes(' open>'));assert.ok(homepage.includes('class="guide-section') || homepage.includes('practical guide-section'));
assert.ok((await req('/')).headers.get('Content-Security-Policy').includes("media-src 'self'"));
const homeSchema=JSON.parse(homepage.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)[1]);assert.ok(homeSchema['@graph'].some(x=>x['@type']==='FAQPage'));
const motion=await readFile(new URL('../src/static/motion.js',import.meta.url),'utf8');let calls=0,observations=0;let callback,changed;const element={dataset:{sequence:'1'},animate(frames,options){calls++;assert.equal(frames.at(-1).opacity,1);assert.ok(options.duration<1000)}};
function Observer(fn){callback=fn;this.observe=()=>{observations++};this.unobserve=()=>{};this.disconnect=()=>{}};
runInNewContext(motion,{window:{matchMedia:()=>({matches:false,addEventListener:(name,fn)=>{changed=fn}}),IntersectionObserver:Observer},IntersectionObserver:Observer,document:{querySelectorAll:()=>[element],getAnimations:()=>[]}});
assert.equal(observations,1);assert.equal(calls,0);callback([{isIntersecting:true,target:element}]);assert.equal(calls,1);changed({matches:true});
runInNewContext(motion,{window:{matchMedia:()=>({matches:true})}});
assert.ok(!motion.includes('fetch('));assert.ok(!motion.includes('innerHTML'));assert.ok(!motion.includes('style.opacity'));
console.log(JSON.stringify({pages:info.pages.length,internalLinksAndAssets:count,security:'passed',seo:'passed',responseSemantics:'passed',mode:info.production?'production':'private-preview',browserQA:'not available in this environment'}));
