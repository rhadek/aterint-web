import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const code=await readFile(new URL('../src/static/motion.js',import.meta.url),'utf8');
const css=await readFile(new URL('../src/static/style.css',import.meta.url),'utf8');
function element(){
 const classes=new Set();
 const el={dataset:{},hidden:false,props:{},events:{},clientHeight:500,scrollHeight:400,
  classList:{toggle(k,force){const yes=force??!classes.has(k);yes?classes.add(k):classes.delete(k);return yes},remove(k){classes.delete(k)},contains:k=>classes.has(k)},
  addEventListener(k,fn){this.events[k]=fn},setAttribute(k,v){this[k]=v},removeAttribute(k){delete this[k]},
  contains(other){return other===this},animate(){return {finish(){},cancel(){}}},querySelectorAll(){return []}};
 el.style={setProperty:(k,v)=>{el.props[k]=v},removeProperty:k=>{delete el.props[k]}};return el;
}
function fixture({width=1400,height=900,reduce=false,overflow=false,intro=false,initialY=0,hash=''}={}){
 const selectors=['.service-window','.service-window-name','.service-window-counter','.hero-home','.hero-light','.hero-object','[data-parallax]','.technical-orbit','.reading-progress','.activity-band','.band-toggle','.guide-section','.information-grid','.guide-viewport','.guide-controls','.guide-position','[data-guide-prev]','[data-guide-next]','.technical-footer','.footer-signature','.contact','[data-ambient-video]'];
 const els=Object.fromEntries(selectors.map(s=>[s,element()]));
 if(intro){els['.intro-screen']=element();els['.intro-screen'].hidden=true;}
 const folds=Array.from({length:6},element),animations=[];
 const servicePhotos=Array.from({length:3},(_,i)=>{const image=element();image.dataset.caption=['Podklady a příprava','Kontroly a vybavení','Realizace a montáže'][i];return image});
 els['.service-window'].getBoundingClientRect=()=>({top:0,bottom:width<900?180:600});
 let queue=[],timers=new Map(),timerId=0,scrolled,playCalls=0;
 const pref={matches:reduce,events:{},addEventListener(k,f){this.events[k]=f}},pointer={matches:width>1000};
 const win={scrollY:initialY,location:{hash},innerHeight:height,innerWidth:width,IntersectionObserver:class{},matchMedia:q=>q.includes('reduced')?pref:pointer,
  requestAnimationFrame(f){queue.push(f);return queue.length},events:{},addEventListener(k,f){this.events[k]=f},scrollTo(options){scrolled=options}};
 const foldTop=index=>1200+folds.slice(0,index).reduce((sum,fold)=>sum+(fold.open?386:126),0)-win.scrollY;
 folds.forEach((fold,i)=>{
  fold.open=false;fold.dataset.photo=String(Math.floor(i/2));fold.summary=element();fold.summary.tagName='SUMMARY';fold.summary.matches=()=>false;
  fold.link={tagName:'A'};fold.contains=other=>other===fold.summary||other===fold.link;
  fold.summary.getBoundingClientRect=()=>({height:125,top:foldTop(i),bottom:foldTop(i)+125});
  fold.querySelector=()=>fold.summary;fold.getBoundingClientRect=()=>({height:fold.open?386:126,top:foldTop(i),bottom:foldTop(i)+(fold.open?386:126)});
  fold.animate=(frames,options)=>{const animation={frames,options,playState:'running',cancel(){this.playState='idle';this.oncancel?.()},finish(){this.playState='finished';this.onfinish?.()}};animations.push(animation);return animation};
 });
 const guidePanels=Array.from({length:4},element),guideStops=Array.from({length:4},element);
 if(overflow) guidePanels[0].scrollHeight=700;
 const guide=els['.guide-section'];
 guide.querySelectorAll=s=>({'.information-grid article':guidePanels,'.guide-stop':guideStops}[s]||[]);
 guide.offsetHeight=4*height;guide.getBoundingClientRect=()=>({top:7200-win.scrollY,height:4*height});
 els['.information-grid'].scrollWidth=4*width;els['.guide-viewport'].clientWidth=width;
 els['.hero-home'].getBoundingClientRect=()=>({top:-win.scrollY,left:0,width,height});
 els['.technical-footer'].getBoundingClientRect=()=>({top:12000-win.scrollY,height:700});
 els['.contact'].getBoundingClientRect=()=>({top:11100-win.scrollY,height:900});
 const film=els['[data-ambient-video]'];
 film.paused=true;film.pause=()=>{film.paused=true;film.events.pause?.()};film.play=()=>{playCalls++;film.paused=false;film.events.play?.();return Promise.resolve()};
 const doc={body:element(),hidden:false,documentElement:{scrollHeight:12700,classList:element().classList},querySelector:s=>els[s],querySelectorAll:s=>s==='.service-fold'?folds:s==='.service-window-photo'?servicePhotos:[],events:{},addEventListener(k,f){this.events[k]=f},getAnimations:()=>animations.filter(a=>a.playState==='running')};
 const observers=[];
 class Observer{constructor(fn){this.fn=fn;this.targets=[];observers.push(this)}observe(t){this.targets.push(t)}unobserve(){}disconnect(){}}
 runInNewContext(code,{window:win,document:doc,IntersectionObserver:Observer,setTimeout(f){timers.set(++timerId,f);return timerId},clearTimeout(id){timers.delete(id)}});
 function flush(){let runs=0;while(queue.length){assert.ok(++runs<500,'animation frame settles');const q=queue;queue=[];q.forEach(f=>f())}}
 function scroll(y){win.scrollY=y;win.events.scroll();flush()}
 function idle(){const pending=[...timers.values()];timers.clear();pending.forEach(f=>f());flush()}
 function finish(){animations.filter(a=>a.playState==='running').forEach(a=>a.finish());flush()}
 flush();
 return {els,folds,servicePhotos,animations,guide,guidePanels,guideStops,win,doc,pref,film,observers,flush,scroll,idle,finish,get scrolled(){return scrolled},get playCalls(){return playCalls}};
}
const f=fixture(),{els,folds,animations,guide,guidePanels,guideStops,win,doc,pref,film}=f;
// Reloaded scroll positions and section links must not suppress the approved intro.
for(const options of [{},{initialY:1200},{initialY:7200,hash:'#uzitecne'}]){
 const loading=fixture({intro:true,...options});assert.equal(loading.els['.intro-screen'].hidden,false);
 loading.scroll(loading.win.scrollY+10);assert.equal(loading.els['.intro-screen'].hidden,false,'automatic restoration does not dismiss loading');
 loading.idle();assert.equal(loading.els['.intro-screen'].hidden,true,'intro ends on its original timer');
}
const skipIntro=fixture({intro:true});skipIntro.win.events.wheel();assert.equal(skipIntro.els['.intro-screen'].hidden,true,'intentional scrolling can skip the intro');
const quietIntro=fixture({intro:true,reduce:true});assert.equal(quietIntro.els['.intro-screen'].hidden,true,'reduced motion stays respected');
assert.ok(guide.classList.contains('guide-slider'));assert.ok(doc.documentElement.classList.contains('guide-snap'));
assert.ok(!code.includes('chapter-snap'));assert.ok(!css.includes('chapter-snap'));assert.ok(!css.includes('scroll-snap-type:y mandatory'),'no page-wide compulsory snapping');
assert.match(css,/html\.guide-snap\{scroll-snap-type:y proximity/);
assert.equal(guideStops.at(-1).props['--snap-y'],'2700.00px');
f.scroll(450);f.idle();assert.ok(parseFloat(els['.hero-home'].props['--hero-scale'])<1);assert.equal(f.scrolled,undefined,'hero remains free');
assert.ok(doc.documentElement.classList.contains('film-snap'));
assert.match(css,/\.film-snap \.cinema-section\{scroll-snap-align:start;scroll-snap-stop:always/);
let prevented=false;
folds[1].summary.events.click({preventDefault(){prevented=true}});assert.ok(prevented);assert.ok(folds[1].open);
assert.equal(animations.at(-1).frames[0].height,'126px');assert.equal(animations.at(-1).frames[1].height,'386px');
f.finish();assert.equal(folds[1].props.overflow,undefined);assert.equal(folds[0].open,false);
folds[1].summary.events.click({preventDefault(){}});f.finish();assert.equal(folds[1].open,false);
folds[2].summary.events.click({preventDefault(){}});folds[2].summary.events.click({preventDefault(){}});f.finish();assert.equal(folds[2].open,false,'rapid reversal closes');
assert.equal(f.scrolled,undefined,'service folds never force window scrolling');
// Scrolling changes the shared photograph, never the open state or page position.
const s=fixture();
s.scroll(1100);s.finish();assert.ok(s.servicePhotos[1].classList.contains('is-current'));assert.deepEqual(s.folds.map(f=>f.open),Array(6).fill(false));
s.scroll(1450);s.finish();assert.ok(s.servicePhotos[2].classList.contains('is-current'));assert.equal(s.els['.service-window-name'].textContent,'Realizace a montáže');
s.scroll(930);s.finish();assert.ok(s.servicePhotos[0].classList.contains('is-current'),'upward reading returns to earlier photograph');
s.folds[3].summary.events.click({preventDefault(){}});s.finish();s.folds[1].summary.events.click({preventDefault(){}});s.finish();assert.ok(s.folds[3].open && s.folds[1].open,'opening another service does not close the one being read');
s.scroll(1600);s.finish();assert.ok(s.folds[3].open && s.folds[1].open,'scrolling never closes manually opened details');assert.equal(s.scrolled,undefined);
for(const width of [320,390,768,1024,1920]){
 const reading=fixture({width});reading.scroll(1300);reading.finish();assert.ok(reading.servicePhotos[1].classList.contains('is-current'),`photo follows reading at width ${width}`);assert.ok(reading.folds.every(f=>!f.open));
}
// Guide movement and chapter navigation use exact viewport-wide steps.
f.scroll(8100);assert.equal(els['.guide-position'].textContent,'02 / 04');assert.equal(els['.information-grid'].props['--guide-offset'],'-1400.00px');assert.equal(guidePanels[1].props['--guide-scale'],'1.000');
els['[data-guide-next]'].events.click();assert.equal(f.scrolled.top,9000);els['[data-guide-prev]'].events.click();assert.equal(f.scrolled.top,7200);
prevented=false;els['.guide-controls'].events.keydown({key:'ArrowRight',preventDefault(){prevented=true}});assert.ok(prevented);assert.equal(f.scrolled.top,9000);
f.scroll(9900);assert.equal(els['.guide-position'].textContent,'04 / 04');assert.equal(els['[data-guide-next]'].disabled,true);
// Partial gestures settle fully; short intentional gestures advance instead of repeatedly springing back.
const snap=fixture();snap.scroll(7200);snap.idle();snap.scroll(7280);snap.idle();assert.equal(snap.scrolled.top,8100,'small scroll advances a whole chapter');
snap.scroll(8100);snap.win.events.scrollend();snap.idle();assert.equal(snap.scrolled.top,8100,'completion does not overshoot');
snap.win.events.wheel();snap.scroll(8390);snap.win.events.scrollend();snap.idle();assert.equal(snap.scrolled.top,9000,'native scrollend settles the next chapter');
snap.scroll(9000);snap.win.events.scrollend();snap.idle();snap.scroll(8920);snap.idle();assert.equal(snap.scrolled.top,8100,'backward gesture returns to the previous chapter');
snap.win.events.wheel();snap.scroll(9650);snap.idle();assert.equal(snap.scrolled.top,9900,'interrupted settling can select another chapter');
snap.scroll(9900);snap.win.events.scrollend();snap.idle();snap.scroll(10050);snap.idle();assert.equal(snap.scrolled.top,9900,'leaving the last chapter does not trigger a new jump');
const outside=fixture();outside.scroll(2000);outside.idle();outside.scroll(12000);outside.idle();assert.equal(outside.scrolled,undefined,'services and footer remain free');
const anchor=fixture();anchor.scroll(7200);anchor.idle();anchor.doc.events.click({target:{closest:()=>({getAttribute:()=>'.contact'})}});anchor.scroll(8400);anchor.idle();assert.equal(anchor.scrolled,undefined,'anchor navigation is not pulled back into the guide');
// Horizontal layout remains enabled across mobile, tablet and desktop sizes, including short landscape views.
for(const [width,height] of [[320,568],[390,844],[768,1024],[844,390],[1024,768],[1920,1080]]){
 const r=fixture({width,height});assert.ok(r.guide.classList.contains('guide-slider'),`horizontal ${width}x${height}`);
 r.scroll(7200+height);assert.equal(r.els['.information-grid'].props['--guide-offset'],(-width).toFixed(2)+'px');
 r.els['.guide-viewport'].events.pointerdown({pointerType:'touch',clientX:260,clientY:300});
 r.els['.guide-viewport'].events.pointerup({pointerType:'touch',clientX:100,clientY:308});assert.equal(r.scrolled.top,7200+2*height,'horizontal swipe advances');
}
const big=fixture({width:320,height:480,overflow:true});assert.ok(big.guide.classList.contains('guide-slider'));assert.equal(big.guidePanels[0].tabindex,'0','overflow text can be reached with the keyboard');
big.scroll(7680);assert.equal(big.guidePanels[0].tabindex,undefined,'offscreen overflow panels do not intercept tab focus');
const touch=fixture({width:390,height:844});touch.scroll(7200);touch.idle();touch.win.events.touchstart();touch.scroll(7440);touch.idle();assert.equal(touch.scrolled,undefined,'no automatic jump while a finger still touches the screen');touch.win.events.touchend();touch.idle();assert.equal(touch.scrolled.top,8044);
assert.match(css,/overflow-y:auto;scrollbar-width:thin/);assert.match(css,/align-content:safe center/);
f.scroll(0);els['.hero-home'].events.pointermove({pointerType:'mouse',clientX:1300,clientY:180});f.flush();assert.ok(parseFloat(els['.hero-object'].props['--tilt-y'])>0);
f.scroll(12200);assert.equal(els['.footer-signature'].props['--signature-cut'],'0.00%');
// Muted playback is deferred, resumable after automatic pauses, and stoppable by the user.
const filmObserver=f.observers.find(o=>o.targets.includes(film)),tick=()=>new Promise(resolve=>setImmediate(resolve));
assert.equal(f.playCalls,0);assert.equal(film.muted,true);
filmObserver.fn([{isIntersecting:true,intersectionRatio:.9}]);await tick();assert.equal(f.playCalls,1);assert.equal(film.paused,false);
filmObserver.fn([{isIntersecting:false,intersectionRatio:0}]);assert.ok(film.paused);
filmObserver.fn([{isIntersecting:true,intersectionRatio:.9}]);await tick();assert.equal(f.playCalls,2);
doc.hidden=true;doc.events.visibilitychange();assert.ok(film.paused);doc.hidden=false;doc.events.visibilitychange();await tick();assert.equal(f.playCalls,3);
film.pause();filmObserver.fn([{isIntersecting:false,intersectionRatio:0}]);filmObserver.fn([{isIntersecting:true,intersectionRatio:.9}]);await tick();assert.equal(f.playCalls,3);
film.play();await tick();assert.equal(f.playCalls,4);pref.matches=true;pref.events.change();f.flush();assert.ok(film.paused);
assert.equal(guide.classList.contains('guide-slider'),false);assert.equal(els['.information-grid'].props['--guide-offset'],'0px');assert.equal(els['.hero-object'].props['--tilt-y'],'0deg');assert.equal(els['.band-toggle'].hidden,true);assert.equal(doc.documentElement.classList.contains('guide-snap'),false);assert.equal(doc.documentElement.classList.contains('film-snap'),false);
prevented=false;folds[3].summary.events.click({preventDefault(){prevented=true}});assert.equal(prevented,false,'reduced motion leaves native details');
filmObserver.fn([{isIntersecting:true,intersectionRatio:.9}]);await tick();assert.equal(f.playCalls,4);
const reduced=fixture({reduce:true});reduced.scroll(1150);reduced.idle();assert.equal(reduced.folds[0].open,false,'reduced motion preserves manual details');assert.equal(reduced.scrolled,undefined);
pref.matches=false;pref.events.change();f.flush();await tick();assert.ok(guide.classList.contains('guide-slider'));
els['.band-toggle'].events.click();assert.equal(els['.band-toggle']['aria-pressed'],'true');assert.ok(els['.activity-band'].classList.contains('is-paused'));
console.log('Motion checks passed: shared scroll-driven photographs, stable manual service details, six responsive guide sizes, complete chapter settling, swipe/navigation, free scrolling outside guide, overflow reading, film playback and reduced motion.');
