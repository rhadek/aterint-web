(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window)) return;
  let revealObserver;
  function reveal() {
    revealObserver?.disconnect();
    if (reduced.matches) return;
    revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        revealObserver.unobserve(entry.target);
        if (typeof entry.target.animate !== 'function') continue;
        // Arriving from below the element (scrolling up): show it as it is, no rise-up.
        if (entry.boundingClientRect && entry.boundingClientRect.top < 0) { entry.target.style?.setProperty?.('--contact-line', '1'); continue; }
        if (entry.target.hasAttribute?.('data-contact-reveal')) {
          entry.target.style.setProperty('--contact-line', '1');
          entry.target.animate([{ transform: 'translateY(18px)' }, { transform: 'translateY(0)' }],
            { duration: 900, easing: 'cubic-bezier(.16,1,.3,1)' });
          continue;
        }
        entry.target.animate([
          { opacity: 0, transform: 'translateY(24px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 800, delay: Math.min(Number(entry.target.dataset.sequence || 0) * 90, 270), easing: 'cubic-bezier(.18,1,.25,1)' });
      }
    }, { threshold: 0.08 });
    document.querySelectorAll('[data-reveal], [data-contact-reveal]').forEach(element => revealObserver.observe(element));
  }
  reveal();
  if (!document.querySelector || !window.requestAnimationFrame) {
    reduced.addEventListener('change', event => {
      if (event.matches) {
        revealObserver?.disconnect();
        document.getAnimations().forEach(animation => animation.finish());
      }
    });
    return;
  }
  const body = document.body;
  const hero = document.querySelector('.hero-home');
  const intro = document.querySelector('.intro-screen');
  let introDelay = 0;
  if (hero && intro && !reduced.matches) {
    intro.hidden = false;
    introDelay = 820;
    setTimeout(() => { intro.hidden = true; }, 1450);
  }
  function dismissIntro() { if (intro) intro.hidden = true; }
  const light = document.querySelector('.hero-light');
  const object = document.querySelector('.hero-object');
  const parallax = document.querySelector('[data-parallax]');
  const orbit = document.querySelector('.technical-orbit');
  const progress = document.querySelector('.reading-progress');
  const band = document.querySelector('.activity-band');
  const pause = document.querySelector('.band-toggle');
  const serviceFolds = [...document.querySelectorAll('.service-fold')];
  const serviceSummaries = serviceFolds.map(fold => fold.querySelector('summary'));
  const foldAnimations = new Map();
  const serviceWindow = document.querySelector('.service-window');
  const servicePhotos = [...document.querySelectorAll('.service-window-photo')];
  const serviceCaption = document.querySelector('.service-window-name');
  const serviceCounter = document.querySelector('.service-window-counter');
  const guide = document.querySelector('.guide-section');
  const guideTrack = document.querySelector('.information-grid');
  const guideViewport = document.querySelector('.guide-viewport');
  const guideControls = document.querySelector('.guide-controls');
  const guideCounter = document.querySelector('.guide-position');
  const guidePrev = document.querySelector('[data-guide-prev]');
  const guideNext = document.querySelector('[data-guide-next]');
  const guidePanels = guide ? [...guide.querySelectorAll('.information-grid article')] : [];
  const guideStops = guide ? [...guide.querySelectorAll('.guide-stop')] : [];
  const footer = document.querySelector('.technical-footer');
  const signature = document.querySelector('.footer-signature');
  const contact = document.querySelector('.contact');
  const film = document.querySelector('[data-ambient-video]');
  const filmScene = document.querySelector('.cinema-section');
  const filmMotionToggle = document.querySelector('.cinema-motion-toggle');
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
  const css = (element, name, value) => element?.style.setProperty(name, value);
  const number = n => String(n).padStart(2, '0');
  let pending = 0, needsMeasure = true, horizontal = false, guideActive = -1;
  let guideTop = 0, guideDistance = 1, guideTravel = 0;
  let heroTop = 0, heroHeight = 1, footerTop = 0, footerHeight = 1, contactTop = 0, pageTravel = 1;
  let aims = [0, 0], position = [0, 0], lightAim = [0, 0], lightPosition = [0, 0];
  let pointerInside = false, heroRect;
  let filmVisible = false, filmUserPaused = false, filmAutoPausing = false, filmStarting = false;
  let serviceActive = -1, serviceManualY = null;
  let guideSnapTimer, guideSnapTarget = null, guideGestureStart = null, guideTouch = null;
  let touchScrolling = false;
  let scrollLastY = window.scrollY, scrollDirection = 0;

  // Preserve real text nodes and line breaks. All text is visible without JavaScript.
  let textObserver;
  const textHeadings = [...document.querySelectorAll('[data-text-reveal]')];
  function splitText(node) {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3 && child.textContent.trim()) {
        const fragment = document.createDocumentFragment();
        for (const part of child.textContent.split(/(\s+)/)) {
          if (!part.trim()) { fragment.appendChild(document.createTextNode(part)); continue; }
          const mask = document.createElement('span'), word = document.createElement('span');
          mask.className = 'text-mask'; word.className = 'text-word'; word.textContent = part;
          mask.appendChild(word); fragment.appendChild(mask);
        }
        node.replaceChild(fragment, child);
      } else if (child.nodeType === 1 && !child.classList.contains('heading-dot')) splitText(child);
    }
  }
  if (document.createDocumentFragment) textHeadings.forEach(splitText);
  function revealText() {
    textObserver?.disconnect();
    if (reduced.matches) return;
    textObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        textObserver.unobserve(entry.target);
        if (entry.boundingClientRect && entry.boundingClientRect.top < 0) continue;
        entry.target.querySelectorAll('.text-word').forEach((word, index) => {
          word.animate([{ transform: 'translateY(108%) rotate(3deg)' }, { transform: 'translateY(0) rotate(0)' }],
            { duration: 850, delay: index * 55, fill: 'backwards', easing: 'cubic-bezier(.16,1,.3,1)' });
        });
      }
    }, { threshold: .25 });
    textHeadings.forEach(heading => textObserver.observe(heading));
  }
  revealText();

  function schedule() {
    if (!pending && !document.hidden) pending = window.requestAnimationFrame(render);
  }
  function measure() {
    needsMeasure = false;
    const scroll = window.scrollY;
    if (hero) {
      hero.classList.remove('hero-overflow');
      const copy = hero.querySelector?.('.hero-copy');
      if (copy && band && copy.getBoundingClientRect().bottom > band.getBoundingClientRect().top - 8) hero.classList.toggle('hero-overflow', true);
      const rect = hero.getBoundingClientRect();
      heroTop = rect.top + scroll; heroHeight = rect.height; heroRect = rect;
      if (!pointerInside) {
        lightAim = [rect.width * .72 - 350, rect.height * .35 - 350];
        lightPosition = [...lightAim];
      }
    }
    if (guide && guideControls && guidePanels.length) {
      horizontal = !reduced.matches;
      guide.classList.toggle('guide-slider', horizontal);
      guideControls.hidden = !horizontal;
      // The same chapters work at every width. Exceptionally large text can
      // scroll inside its chapter instead of being clipped or hidden.
      guidePanels.forEach(panel => {
        const overflowing = horizontal && panel.scrollHeight > panel.clientHeight + 2;
        panel.classList.toggle('is-scrollable', overflowing);
        panel.removeAttribute('tabindex');
      });
      if (!horizontal) {
        css(guideTrack, '--guide-offset', '0px');
        guidePanels.forEach(panel => { css(panel, '--guide-scale', '1'); css(panel, '--guide-copy-y', '0px'); });
      }
      guideActive = -1;
    }
    document.documentElement.classList.toggle('guide-snap', horizontal && !reduced.matches);
    document.documentElement.classList.toggle('film-snap', !!film && !reduced.matches);
    if (horizontal) {
      guideTop = guide.getBoundingClientRect().top + scroll;
      guideDistance = Math.max(1, guide.offsetHeight - window.innerHeight);
      guideTravel = guideViewport.clientWidth * (guidePanels.length - 1);
      guideStops.forEach((stop, i) => css(stop, '--snap-y', (i / (guidePanels.length - 1) * guideDistance).toFixed(2) + 'px'));
    }
    if (footer) { const rect = footer.getBoundingClientRect(); footerTop = rect.top + scroll; footerHeight = rect.height; }
    if (contact) contactTop = contact.getBoundingClientRect().top + scroll;
    pageTravel = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }
  function render() {
    pending = 0;
    if (needsMeasure) measure();
    const y = window.scrollY, motion = !reduced.matches;
    followServices(y);
    css(progress, '--read-progress', motion ? clamp(y / pageTravel) : 0);
    if (horizontal) {
      const fraction = clamp((y - guideTop) / guideDistance), phase = fraction * (guidePanels.length - 1);
      const current = Math.round(phase);
      css(guideTrack, '--guide-offset', (-guideTravel * fraction).toFixed(2) + 'px');
      guidePanels.forEach((panel, i) => {
        const away = clamp(Math.abs(phase - i));
        css(panel, '--guide-scale', (1 - away * .065).toFixed(3));
        css(panel, '--guide-radius', (away * 20).toFixed(2) + 'px');
        css(panel, '--guide-copy-y', ((i - phase) * 20).toFixed(2) + 'px');
      });
      if (current !== guideActive) {
        guideActive = current;
        guideCounter.textContent = number(current + 1) + ' / ' + number(guidePanels.length);
        guidePrev.disabled = current === 0; guideNext.disabled = current === guidePanels.length - 1;
        guidePanels.forEach((panel, index) => {
          if (index === current && panel.classList.contains('is-scrollable')) panel.setAttribute('tabindex', '0');
          else panel.removeAttribute('tabindex');
        });
      }
    }
    if (signature) {
      const fill = motion ? clamp((y + window.innerHeight - footerTop) / Math.max(1, footerHeight)) : 1;
      css(signature, '--signature-cut', ((1 - fill) * 100).toFixed(2) + '%');
    }
    if (contact) {
      const entered = clamp((y + window.innerHeight - contactTop) / window.innerHeight);
      css(contact, '--contact-angle', (motion ? -16 + entered * 16 : 0).toFixed(2) + 'deg');
      if (!motion) css(contact, '--contact-line', '1');
    }
    if (hero && motion && y < heroTop + heroHeight && y + window.innerHeight > heroTop) {
      const fraction = clamp((y - heroTop) / heroHeight);
      css(hero, '--hero-scale', (1 - fraction * .045).toFixed(3));
      css(hero, '--hero-radius', (fraction * 36).toFixed(2) + 'px');
      css(parallax, '--parallax-y', (fraction * 100).toFixed(2) + 'px');
      css(orbit, '--orbit-scale', (1 + fraction * .22).toFixed(3));
      const strength = pointer.matches ? 1 : 0;
      let settling = false;
      for (let i = 0; i < 2; i++) {
        position[i] += (aims[i] * strength - position[i]) * .1;
        lightPosition[i] += (lightAim[i] - lightPosition[i]) * .08;
        if (Math.abs(aims[i] * strength - position[i]) > .005 || Math.abs(lightAim[i] - lightPosition[i]) > .2) settling = true;
      }
      css(object, '--tilt-x', (-position[1] * 9).toFixed(3) + 'deg');
      css(object, '--tilt-y', (position[0] * 12).toFixed(3) + 'deg');
      css(object, '--object-x', (position[0] * 12).toFixed(2) + 'px');
      css(light, '--light-x', lightPosition[0].toFixed(2) + 'px');
      css(light, '--light-y', lightPosition[1].toFixed(2) + 'px');
      if (settling) schedule();
    }
  }
  function configure() {
    body.classList.toggle('motion-ready', !reduced.matches);
    if (filmMotionToggle) filmMotionToggle.hidden = reduced.matches;
    if (pause) pause.hidden = reduced.matches;
    if (reduced.matches) {
      cancelGuideSnap();
      if (intro) intro.hidden = true;
      css(hero, '--hero-scale', '1'); css(hero, '--hero-radius', '0px');
      revealObserver?.disconnect(); textObserver?.disconnect();
      document.getAnimations().forEach(animation => animation.cancel());
      css(parallax, '--parallax-y', '0px');
      css(object, '--tilt-x', '0deg'); css(object, '--tilt-y', '0deg'); css(object, '--object-x', '0px');
      pauseFilm();
    }
    needsMeasure = true; schedule();
  }
  // Details open only through deliberate activation and remain native without JS.
  function setFold(fold, opening) {
    const previous = foldAnimations.get(fold);
    if ((previous ? previous.opening : fold.open) === opening) return;
    const start = fold.getBoundingClientRect().height;
    previous?.animation.cancel();
    if (reduced.matches || typeof fold.animate !== 'function') {
      fold.open = opening; needsMeasure = true; schedule(); return;
    }
    fold.open = true;
    const end = opening ? fold.getBoundingClientRect().height : fold.querySelector('summary').getBoundingClientRect().height + 1;
    fold.style.setProperty('overflow', 'hidden');
    const animation = fold.animate([{ height: start + 'px' }, { height: end + 'px' }],
      { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' });
    const state = { animation, opening };
    foldAnimations.set(fold, state);
    const complete = () => {
      if (foldAnimations.get(fold) !== state) return;
      fold.open = opening;
      fold.style.removeProperty('overflow');
      foldAnimations.delete(fold);
      needsMeasure = true; schedule();
    };
    animation.onfinish = complete;
    animation.oncancel = complete;
  }
  function selectService(index) {
    if (index === serviceActive || !serviceFolds[index]) return;
    serviceActive = index;
    const photo = Number(serviceFolds[index].dataset.photo || 0);
    serviceFolds.forEach((fold, i) => fold.classList.toggle('is-reading', i === index));
    servicePhotos.forEach((image, i) => image.classList.toggle('is-current', i === photo));
    if (serviceCaption && servicePhotos[photo]) serviceCaption.textContent = servicePhotos[photo].dataset.caption;
    if (serviceCounter) serviceCounter.textContent = number(index + 1) + ' / ' + number(serviceFolds.length);
  }
  function followServices(y) {
    if (!serviceFolds.length || !serviceWindow) return;
    if (serviceManualY !== null && Math.abs(y - serviceManualY) < 60) return;
    const rects = serviceSummaries.map(summary => summary.getBoundingClientRect());
    if (rects[0].top > window.innerHeight || serviceFolds.at(-1).getBoundingClientRect().bottom < 0) return;
    const line = window.innerWidth < 900
      ? Math.min(window.innerHeight * .7, serviceWindow.getBoundingClientRect().bottom + 80)
      : window.innerHeight * .42;
    let next = 0;
    rects.forEach((rect, index) => { if (rect.top <= line) next = index; });
    // A small threshold prevents flicker around a row boundary. Only the image
    // and reading marker change; scrolling never modifies a details open state.
    if (next > serviceActive && rects[next].top > line - 18) return;
    if (next < serviceActive && rects[serviceActive].top < line + 18) return;
    selectService(next);
    css(serviceWindow, '--service-drift', reduced.matches ? '0px' : (clamp((line - rects[next].top) / window.innerHeight) * -2).toFixed(2) + 'px');
  }
  selectService(0);
  serviceFolds.forEach((fold, index) => {
    const summary = serviceSummaries[index];
    fold.addEventListener('toggle', () => { needsMeasure = true; schedule(); });
    fold.addEventListener('focusin', () => { serviceManualY = window.scrollY; selectService(index); });
    summary.addEventListener('click', event => {
      selectService(index);
      serviceManualY = window.scrollY;
      if (reduced.matches || typeof fold.animate !== 'function') return;
      event.preventDefault();
      const previous = foldAnimations.get(fold);
      const opening = previous ? !previous.opening : !fold.open;
      setFold(fold, opening);
    });
  });
  function cancelGuideSnap() {
    clearTimeout(guideSnapTimer);
    guideSnapTarget = null; guideGestureStart = null;
  }
  function settleGuide() {
    if (!horizontal || reduced.matches || document.hidden || guideTouch || touchScrolling || guideSnapTarget !== null) return;
    if (document.documentElement.classList?.contains?.('fx-wheeling')) { queueGuideSnap(); return; }
    const y = window.scrollY;
    // No wheel/touch interception and no snapping outside these four chapters.
    if (y < guideTop || y > guideTop + guideDistance) { guideGestureStart = null; return; }
    const step = guideDistance / (guidePanels.length - 1);
    const phase = (y - guideTop) / step;
    let target = Math.round(phase);
    if (guideGestureStart !== null) {
      const startPhase = (guideGestureStart - guideTop) / step;
      const startIndex = Math.round(startPhase);
      if (Math.abs(startPhase - startIndex) < .025 && Math.abs(y - guideGestureStart) > 28 && target === startIndex) {
        target += scrollDirection;
      }
    }
    guideGestureStart = null;
    const top = guideTop + clamp(target, 0, guidePanels.length - 1) * step;
    if (Math.abs(y - top) > 1) {
      guideSnapTarget = top;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }
  function queueGuideSnap(delay = 160) {
    clearTimeout(guideSnapTimer);
    if (!horizontal || guideSnapTarget !== null || guideTouch || touchScrolling) return;
    guideSnapTimer = setTimeout(settleGuide, delay);
  }
  function seekGuide(index) {
    if (!horizontal) return;
    cancelGuideSnap();
    const target = clamp(index, 0, guidePanels.length - 1);
    guideSnapTarget = guideTop + target / (guidePanels.length - 1) * guideDistance;
    window.scrollTo({ top: guideSnapTarget, behavior: 'smooth' });
  }
  guidePrev?.addEventListener('click', () => seekGuide(guideActive - 1));
  guideNext?.addEventListener('click', () => seekGuide(guideActive + 1));
  guideControls?.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); seekGuide(guideActive + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  guideViewport?.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') return;
    cancelGuideSnap();
    guideTouch = { x: event.clientX, y: event.clientY };
  }, { passive: true });
  guideViewport?.addEventListener('pointerup', event => {
    if (!guideTouch) return;
    const dx = event.clientX - guideTouch.x, dy = event.clientY - guideTouch.y;
    guideTouch = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) seekGuide(guideActive + (dx < 0 ? 1 : -1));
    else queueGuideSnap();
  }, { passive: true });
  guideViewport?.addEventListener('pointercancel', () => { guideTouch = null; queueGuideSnap(); }, { passive: true });
  hero?.addEventListener('pointermove', event => {
    if (reduced.matches || !pointer.matches || event.pointerType === 'touch') return;
    heroRect = hero.getBoundingClientRect(); pointerInside = true;
    const x = event.clientX - heroRect.left, y = event.clientY - heroRect.top;
    aims = [clamp(x / heroRect.width * 2 - 1, -1, 1), clamp(y / heroRect.height * 2 - 1, -1, 1)];
    lightAim = [x - 350, y - 350]; schedule();
  }, { passive: true });
  hero?.addEventListener('pointerleave', () => { pointerInside = false; aims = [0, 0]; schedule(); });
  pause?.addEventListener('click', () => {
    const paused = band.classList.toggle('is-paused');
    body.classList.toggle('decorations-paused', paused);
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? 'Spustit pohyb pásu' : 'Pozastavit pohyb pásu');
    pause.textContent = paused ? '▶' : 'Ⅱ';
  });
  // Start the muted film only when it enters the viewport. A visitor's pause stays respected.
  filmMotionToggle?.addEventListener('click', () => {
    const paused = filmScene.classList.toggle('cinema-paused');
    filmMotionToggle.setAttribute('aria-pressed', String(paused));
    filmMotionToggle.querySelector('span').textContent = paused ? '▶' : 'Ⅱ';
  });
  function pauseFilm() {
    if (!film || film.paused) return;
    filmAutoPausing = true;
    film.pause();
  }
  function playFilm() {
    if (!film || !filmVisible || document.hidden || reduced.matches || filmUserPaused || !film.paused || filmStarting) return;
    filmStarting = true;
    Promise.resolve(film.play()).catch(() => {
      // Native controls remain available if autoplay is blocked by the browser.
    }).finally(() => {
      filmStarting = false;
      if (!filmVisible || document.hidden || reduced.matches) pauseFilm();
    });
  }
  if (film) {
    film.muted = true;
    film.addEventListener('pause', () => {
      if (filmAutoPausing) { filmAutoPausing = false; return; }
      if (filmVisible && !document.hidden) filmUserPaused = true;
    });
    film.addEventListener('play', () => { filmUserPaused = false; });
    new IntersectionObserver(entries => {
      for (const entry of entries) {
        filmVisible = entry.isIntersecting && entry.intersectionRatio >= .8;
        filmScene?.classList.toggle('cinema-in-view', filmVisible);
        if (filmVisible) playFilm(); else pauseFilm();
      }
    }, { threshold: [0, .5, .8, .95] }).observe(film);
  }
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (Math.abs(y - scrollLastY) > .5) scrollDirection = Math.sign(y - scrollLastY);
    if (guideSnapTarget !== null && Math.abs(y - guideSnapTarget) < 2) guideSnapTarget = null;
    if (guideGestureStart === null && guideSnapTarget === null) guideGestureStart = scrollLastY;
    scrollLastY = y;
    schedule(); queueGuideSnap();
  }, { passive: true });
  window.addEventListener('scrollend', () => {
    guideSnapTarget = null; queueGuideSnap(0);
  }, { passive: true });
  // A new gesture always interrupts automatic settling immediately.
  window.addEventListener('wheel', () => { dismissIntro(); if (guideSnapTarget !== null) cancelGuideSnap(); }, { passive: true });
  window.addEventListener('touchstart', () => { dismissIntro(); touchScrolling = true; cancelGuideSnap(); }, { passive: true });
  window.addEventListener('touchend', () => { touchScrolling = false; queueGuideSnap(); }, { passive: true });
  window.addEventListener('touchcancel', () => { touchScrolling = false; queueGuideSnap(); }, { passive: true });
  document.addEventListener('click', event => {
    // Anchor navigation has its own destination. Never pull it back into a chapter.
    const anchor = event.target.closest?.('a[href^="#"]');
    if (!anchor) return;
    dismissIntro();
    const hash = anchor.getAttribute('href');
    if (!hash || hash === '#') return;
    const destination = document.querySelector(hash);
    if (!destination) return;
    cancelGuideSnap();
    guideSnapTarget = window.scrollY + destination.getBoundingClientRect().top;
  });
  window.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) { dismissIntro(); cancelGuideSnap(); }
  });
  window.addEventListener('resize', () => { cancelGuideSnap(); needsMeasure = true; schedule(); queueGuideSnap(); }, { passive: true });
  window.addEventListener('pageshow', () => { needsMeasure = true; schedule(); queueGuideSnap(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseFilm();
    else { playFilm(); schedule(); }
  });
  reduced.addEventListener('change', () => { reveal(); revealText(); configure(); if (!reduced.matches) playFilm(); });
  document.fonts?.ready.then(() => { needsMeasure = true; schedule(); });
  configure();
  if (hero && !reduced.matches) {
    hero.querySelectorAll('.headline-line').forEach((line, index) => {
      line.animate([{ transform: 'translateY(52px) skewY(4deg)', opacity: 0, filter: 'blur(12px)' }, { transform: 'translateY(0) skewY(0)', opacity: 1, filter: 'blur(0)' }],
        { duration: 1300, delay: introDelay + 100 + index * 130, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
    });
  }
})();

// ---------------------------------------------------------------------------
// v13: ember field, photo wipe hooks, link roll, magnetic buttons, cinema
// zoom-in and scroll-velocity band. Everything is decorative: content and
// controls work without it, and reduced motion switches all of it off.
(() => {
  if (typeof document === 'undefined' || !window.matchMedia) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  if (!window.requestAnimationFrame || typeof root?.classList?.add !== 'function' || typeof document.createElement !== 'function') return;
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  // Effects below the first screen start once the browser is idle, so the first paint stays light.
  const later = f => (window.requestIdleCallback ? window.requestIdleCallback(f, { timeout: 1200 }) : setTimeout(f, 250));
  root.classList.add('fx-ready');

  // Embers rising from the hero: the one signature effect.
  function embers(hero, opt) {
    if (!hero || !document.createElement('canvas').getContext) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'ember-field'; canvas.setAttribute('aria-hidden', 'true');
    hero.insertBefore(canvas, hero.firstChild);
    const ctx = canvas.getContext('2d');
    // one pre-rendered glowing ember, stamped many times (much cheaper than per-particle gradients)
    const sprite = document.createElement('canvas'); sprite.width = sprite.height = 64;
    { const g = sprite.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,236,200,1)'); gr.addColorStop(.12, 'rgba(255,170,110,.95)'); gr.addColorStop(.3, 'rgba(255,104,89,.45)'); gr.addColorStop(1, 'rgba(255,80,40,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    let w = 0, h = 0, dpr = 1, visible = true, running = false, last = 0;
    let mx = -9999, my = -9999;
    const embers = [];
    const count = () => Math.round(clamp(w / (opt.density * 1.35), 12, 60));
    function spawn(e, initial) {
      // Most embers rise around the extinguisher, a few drift over the copy.
      const nearArt = opt.focus && Math.random() < (w < 680 ? .5 : .72);
      e.x = nearArt ? w * (w < 680 ? .5 : .74) + (Math.random() - .5) * w * (w < 680 ? .9 : .42) : Math.random() * w;
      e.y = initial ? Math.random() * h : h + 10 + Math.random() * 40;
      e.r = .8 + Math.random() * Math.random() * 2.8;
      e.vy = 14 + Math.random() * 34 + e.r * 6;
      e.sway = 6 + Math.random() * 22; e.freq = .4 + Math.random() * 1.2; e.phase = Math.random() * 6.28;
      e.life = 0; e.max = 4 + Math.random() * 7; e.hue = 8 + Math.random() * 26;
      e.dx = 0;
      return e;
    }
    function size() {
      const rect = hero.getBoundingClientRect();
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      while (embers.length < count()) embers.push(spawn({}, true));
      embers.length = count();
    }
    function frame(t) {
      if (!running) return;
      const dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const e of embers) {
        e.life += dt;
        if (e.life > e.max || e.y < -20) spawn(e, false);
        const k = e.life / e.max;
        const fade = Math.min(1, e.life * 1.6) * (1 - k) * (1 - k);
        // Cursor pushes embers aside like a draft of air.
        const ddx = e.x - mx, ddy = e.y - my, dist2 = ddx * ddx + ddy * ddy;
        if (dist2 < 22500) { const f = (1 - Math.sqrt(dist2) / 150) * 120; e.dx += (ddx > 0 ? 1 : -1) * f * dt; }
        e.dx *= .96;
        e.y -= e.vy * dt;
        const x = e.x + Math.sin(e.life * e.freq + e.phase) * e.sway;
        e.x += e.dx * dt * 6;
        const flicker = .75 + Math.sin(t / 90 + e.phase * 10) * .25;
        const a = fade * flicker;
        if (a <= .01) continue;
        const R = e.r * 7;
        ctx.globalAlpha = Math.min(1, a);
        ctx.drawImage(sprite, x - R, e.y - R, R * 2, R * 2);
      }
      requestAnimationFrame(frame);
    }
    function update() {
      const should = visible && !document.hidden && !reduced.matches && !document.body.classList.contains('decorations-paused');
      if (should && !running) { running = true; last = 0; requestAnimationFrame(frame); }
      if (!should) { running = false; ctx.clearRect(0, 0, w, h); }
      canvas.classList.toggle('is-on', should);
    }
    size();
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; update(); }).observe(hero);
    window.addEventListener('resize', () => { size(); }, { passive: true });
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', update);
    new MutationObserver(update).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    hero.addEventListener('pointermove', ev => { const r = hero.getBoundingClientRect(); mx = ev.clientX - r.left; my = ev.clientY - r.top; }, { passive: true });
    hero.addEventListener('pointerleave', () => { mx = my = -9999; });
    update();
  }
  embers(document.querySelector('.hero-home'), { density: 18, focus: true });

  // Buttons: a hot glow is lit where the pointer enters and follows it.
  document.querySelectorAll('.button').forEach(el => {
    el.classList.add('ignite');
    const at = ev => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--gx', (ev.clientX - r.left).toFixed(1) + 'px');
      el.style.setProperty('--gy', (ev.clientY - r.top).toFixed(1) + 'px');
    };
    el.addEventListener('pointerenter', at);
    el.addEventListener('pointermove', at);
    el.addEventListener('pointerleave', at);
  });

  // Scroll-linked: cinema zoom-in and the band reacting to scroll speed.
  const cinema = document.querySelector('.cinema-section');
  const cinemaBox = document.querySelector('.cinema-container');
  const track = document.querySelector('.activity-track');
  let lastY = window.scrollY, speed = 0, ticking = false, cine = 0, bandAnim = null;
  function cineTarget() {
    if (!cinema || reduced.matches) return 1;
    const r = cinema.getBoundingClientRect(), vh = window.innerHeight;
    // 0 while the section is outside, 1 while it fills the screen, back to 0 as it leaves.
    const enter = clamp((vh - r.top) / (vh * .9));
    const leave = clamp(r.bottom / (vh * .9));
    return Math.min(enter, leave);
  }
  function tick() {
    ticking = false;
    const y = window.scrollY, motion = !reduced.matches;
    let again = false;
    const cr = cinema?.getBoundingClientRect();
    if (cinema && cinemaBox && cr.bottom > -200 && cr.top < window.innerHeight + 200) {
      const target = cineTarget();
      cine += (target - cine) * (motion ? .12 : 1);
      if (Math.abs(target - cine) > .0005) again = true; else cine = target;
      const e = 1 - Math.pow(1 - cine, 3);
      cinemaBox.style.setProperty('--cine-scale', (.74 + e * .26).toFixed(4));
      cinemaBox.style.setProperty('--cine-y', ((1 - e) * 70 * (cinema.getBoundingClientRect().top < 0 ? -1 : 1)).toFixed(2) + 'px');
      cinemaBox.style.setProperty('--cine-dim-o', ((1 - e) * .55).toFixed(3));
    }
    if (track && motion) {
      speed += (Math.abs(y - lastY) - speed) * .2;
      const anim = bandAnim || (bandAnim = track.getAnimations?.()[0]);
      if (anim) anim.playbackRate = 1 + Math.min(speed, 120) / 12;
      if (speed > .3) again = true;
    }
    lastY = y;
    if (again) schedule();
  }
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  schedule();

  later(() => {
  // Service chapters: each full-width illustration opens from inset to edge-to-edge
  // as it reaches the middle of the screen; the photo drifts slower than the page.
  const bands = [...document.querySelectorAll('.svc-band')];
  if (bands.length) {
    let queued = false;
    function paint() {
      queued = false;
      const vh = window.innerHeight, vw = window.innerWidth, motion = !reduced.matches;
      bands.forEach(band => {
        const r = band.getBoundingClientRect();
        if (r.bottom < -150 || r.top > vh + 150) return;   // off screen: nothing to update
        const open = motion ? clamp((vh - r.top) / (vh * .75)) : 1;
        const e = 1 - Math.pow(1 - open, 3);
        const through = clamp((vh - r.top) / (vh + r.height));
        if (e > .35 && !band.classList.contains('is-open')) {
          if (r.top < 0) { band.classList.add('fx-instant', 'is-open'); requestAnimationFrame(() => requestAnimationFrame(() => band.classList.remove('fx-instant'))); }
          else band.classList.add('is-open');
        }
        const img = band.querySelector('img'), title = band.querySelector('.svc-band-title');
        // photo and its blurred surround drift together, by the same pixels
        band.style.setProperty('--band-shift', motion ? ((through - .5) * -.08 * r.height).toFixed(1) + 'px' : '0px');
      });
    }
    const ask = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
    window.addEventListener('scroll', ask, { passive: true });
    window.addEventListener('resize', ask, { passive: true });
    reduced.addEventListener('change', ask);
    ask();
  }

  // Chapter choreography: title letters surface, a glint crosses the photo,
  // the pointer acts as an inspector's torch, service columns assemble.
  if (bands.length && typeof IntersectionObserver === 'function') {
    const motionOn = () => !reduced.matches;
    bands.forEach(band => {
      const title = band.querySelector('.svc-band-title');
      if (title && !title.dataset.split) {
        title.dataset.split = '1';
        const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = title.textContent;
        let ci = 0;
        const words = title.textContent.split(' ');
        title.textContent = '';
        title.appendChild(sr);
        words.forEach((w, wi) => {
          const word = document.createElement('span'); word.className = 'fx-word'; word.setAttribute('aria-hidden', 'true');
          for (const ch of w) { const c = document.createElement('span'); c.className = 'fx-char'; c.textContent = ch; c.style.setProperty('--ci', ci++); word.appendChild(c); }
          title.appendChild(word);
          if (wi < words.length - 1) title.appendChild(document.createTextNode(' '));
        });
      }
      if (fine.matches) {
        band.addEventListener('pointermove', ev => {
          const r = band.getBoundingClientRect();
          band.style.setProperty('--sx', (ev.clientX - r.left).toFixed(0) + 'px');
          band.style.setProperty('--sy', (ev.clientY - r.top).toFixed(0) + 'px');
          band.classList.add('is-torch');
        }, { passive: true });
        band.addEventListener('pointerleave', () => band.classList.remove('is-torch'));
      }
    });
    root.classList.add('fx-chapters');
    // Coming back up from below: switch the element on instantly instead of replaying a downward entrance.
    const showNow = (el, cls) => { el.classList.add('fx-instant', cls); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('fx-instant'))); };
    const lit = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      if (en.boundingClientRect.top < 0) { showNow(en.target, 'is-lit'); en.target.classList.add('is-open'); } else en.target.classList.add('is-lit');
      lit.unobserve(en.target);
    }), { threshold: .45 });
    bands.forEach(b => lit.observe(b));
    document.querySelectorAll('.svc-item').forEach((item, i) => {
      item.querySelectorAll('.svc-items li').forEach((li, j) => li.style.setProperty('--li', j));
      item.style.setProperty('--col', i % 2);
    });
    const built = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      if (en.boundingClientRect.top < 0) showNow(en.target, 'is-in'); else en.target.classList.add('is-in');
      built.unobserve(en.target);
    }), { threshold: .2 });
    document.querySelectorAll('.svc-item').forEach(i => built.observe(i));
    if (!motionOn()) document.querySelectorAll('.svc-band,.svc-item').forEach(el => el.classList.add('is-lit', 'is-in'));
  }

  });
  // Smooth wheel: mouse-wheel steps become one continuous, eased movement.
  // Only plain vertical wheel scrolling of the page is smoothed; zoom, horizontal
  // gestures, touch, keyboard and inner scroll areas stay native.
  if (fine.matches && typeof window.scrollTo === 'function') {
    let target = window.scrollY, current = window.scrollY, raf = 0, setY = -1, snapBack;
    const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
    function innerScrollable(el, dy) {
      for (; el && el !== document.body && el !== root; el = el.parentElement) {
        const st = getComputedStyle(el);
        if (/(auto|scroll)/.test(st.overflowY) && el.scrollHeight > el.clientHeight + 1) {
          if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
        }
      }
      return false;
    }
    let lastT = 0;
    function loop(t) {
      const dt = lastT ? Math.min(.05, (t - lastT) / 1000) : 1 / 60; lastT = t;
      current += (target - current) * (1 - Math.pow(1 - .14, dt * 60));
      if (Math.abs(target - current) < 1) current = target;
      setY = Math.round(current);
      window.scrollTo({ top: current, behavior: 'instant' });
      if (current !== target) raf = requestAnimationFrame(loop);
      else { raf = 0; lastT = 0; root.classList.remove('fx-wheeling'); clearTimeout(snapBack); snapBack = setTimeout(() => root.classList.remove('fx-nosnap'), 900); window.dispatchEvent(new Event('fx-wheel-end')); }
    }
    window.addEventListener('wheel', ev => {
      if (reduced.matches || ev.ctrlKey || ev.defaultPrevented || Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) return;
      if (innerScrollable(ev.target, ev.deltaY)) return;
      ev.preventDefault();
      if (!raf) { target = current = window.scrollY; }
      const unit = ev.deltaMode === 1 ? 40 : ev.deltaMode === 2 ? window.innerHeight : 1;
      target = clamp(target + ev.deltaY * unit, 0, maxY());
      root.classList.add('fx-wheeling', 'fx-nosnap'); clearTimeout(snapBack);
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: false });
    // Anything else that scrolls the page (keys, links, glides) takes over cleanly.
    window.addEventListener('scroll', () => {
      if (raf && Math.abs(window.scrollY - setY) > 3) { cancelAnimationFrame(raf); raf = 0; root.classList.remove('fx-wheeling'); }
    }, { passive: true });
    window.addEventListener('keydown', () => { if (raf) { cancelAnimationFrame(raf); raf = 0; root.classList.remove('fx-wheeling'); } });
    window.addEventListener('fx-wheel-end', () => window.dispatchEvent(new Event('scroll')));
  }

  // Back-to-top button shows once the visitor has left the first screen.
  const toTop = document.querySelector('.to-top');
  if (toTop) {
    const foot = document.querySelector('.technical-footer');
    const film = document.querySelector('.cinema-section');
    const show = () => {
      const vh = window.innerHeight, fr = film?.getBoundingClientRect();
      const onFilm = fr && fr.top < vh * .5 && fr.bottom > vh * .5;
      toTop.classList.toggle('is-shown', window.scrollY > vh * .9 && !onFilm && !(foot && foot.getBoundingClientRect().top < vh * .85));
    };
    window.addEventListener('scroll', show, { passive: true }); show();
  }

  later(() => {
  // Easter egg: a small firefighter lives on the film frame. He peeks out from
  // behind it, climbs onto the top edge, and puts out flames that flare up there.
  const cineBox = document.querySelector('.cinema-container');
  if (cinema && cineBox && !reduced.matches && typeof Promise === 'function' && document.getElementById('ff-template')) {
    const stage = document.createElement('div');
    stage.className = 'ff-stage'; stage.setAttribute('aria-hidden', 'true');
    const tpl = document.getElementById('ff-template');
    if (tpl?.content) stage.appendChild(tpl.content.cloneNode(true));
    cineBox.insertBefore(stage, cineBox.firstChild);
    const ff = stage.querySelector('.ff'), face = stage.querySelector('.ff-face'), flame = stage.querySelector('.ff-flame');
    let visible = false, x = 0, dir = -1, alive = true;
    new IntersectionObserver(([en]) => { visible = en.isIntersecting && en.intersectionRatio > .78; }, { threshold: [0, .5, .78, .95] }).observe(cinema);
    const paused = () => !visible || document.hidden || reduced.matches || cinema.classList.contains('cinema-paused') || document.body.classList.contains('decorations-paused');
    const sleep = ms => new Promise(res => { let left = ms, last = performance.now(); (function t(now) { if (!paused()) left -= now - last; last = now; left > 0 ? requestAnimationFrame(t) : res(); })(last); });
    const W = () => stage.clientWidth, size = () => ff.offsetHeight || 48;
    const place = () => { ff.style.transform = `translateX(${x.toFixed(1)}px)`; face.style.transform = `scaleX(${dir})`; };
    function walkTo(tx, speed = 1) {
      return new Promise(res => {
        dir = tx > x ? 1 : -1; place(); ff.classList.add('walking');
        let last = performance.now();
        (function step(now) {
          const dt = Math.min(.05, (now - last) / 1000); last = now;
          if (!paused()) { const v = size() * 1.6 * speed * dt; x = Math.abs(tx - x) <= v ? tx : x + dir * v; place(); }
          if (x === tx) { ff.classList.remove('walking'); res(); } else requestAnimationFrame(step);
        })(last);
      });
    }
    async function lookAround() { for (let i = 0; i < 2; i++) { dir = -dir; place(); await sleep(450 + Math.random() * 400); } }
    ff.addEventListener('click', () => { ff.classList.remove('hop'); void ff.offsetWidth; ff.classList.add('hop'); });
    const hide = () => stage.classList.remove('is-peeking', 'is-up');
    async function life() {
      let round = 0;
      while (alive) {
        while (!visible) await sleep(300);
        await sleep(round++ ? 5000 + Math.random() * 5000 : 1600);
        const w = W(), s = size();
        // 1. a flame flares up on the edge
        const fx = w * (.1 + Math.random() * .8);
        flame.style.left = fx.toFixed(1) + 'px'; flame.className = 'ff-flame is-burning';
        await sleep(900);
        // 2. the firefighter surfaces from behind the frame, a fair way from the flame
        const side = fx > w / 2 ? -1 : 1;
        x = clamp(fx + side * w * (.22 + Math.random() * .18), s * .2, w - s);
        dir = side; place();
        stage.classList.add('is-peeking');
        await sleep(950);
        // 3. looks around, notices the flame
        dir = -dir; place(); await sleep(500);
        dir = fx > x ? 1 : -1; place(); await sleep(250);
        ff.classList.add('alert'); await sleep(800); ff.classList.remove('alert');
        // 4. jumps onto the edge and runs to it
        stage.classList.add('is-up'); await sleep(550);
        await walkTo(fx > x ? fx - s * 1.55 : fx + s * .85, 2.2);
        dir = fx > x ? 1 : -1; place();
        // 5. puts it out
        ff.classList.add('spraying'); await sleep(900);
        flame.classList.add('is-out'); await sleep(900);
        ff.classList.remove('spraying'); await sleep(500);
        // ...but it flickers back for a moment
        flame.className = 'ff-flame is-burning is-flicker'; await sleep(250);
        ff.classList.add('alert'); ff.classList.remove('hop'); void ff.offsetWidth; ff.classList.add('hop'); await sleep(450); ff.classList.remove('alert');
        ff.classList.add('spraying'); await sleep(450);
        flame.classList.add('is-out'); await sleep(700);
        ff.classList.remove('spraying'); await sleep(300);
        flame.className = 'ff-flame';
        ff.classList.remove('hop'); void ff.offsetWidth; ff.classList.add('hop');
        await sleep(900);
        // 6. waves goodbye with a turn and drops back behind the frame
        dir = -dir; place(); await sleep(400);
        stage.classList.remove('is-up'); stage.classList.add('is-leaving');
        await sleep(50); hide(); await sleep(900); stage.classList.remove('is-leaving');
      }
    }
    life();
    reduced.addEventListener('change', () => { if (reduced.matches) { alive = false; stage.remove(); } });
  }

  // The same firefighter appears in two more places: he waves goodbye from the
  // footer wordmark and searches, puzzled, on the 404 page.
  const ffTpl = document.getElementById('ff-template');
  document.querySelectorAll('[data-ff-spot]').forEach(spot => {
    if (!ffTpl?.content || reduced.matches) return;
    const stage = document.createElement('div');
    stage.className = 'ff-stage ff-mini';
    stage.appendChild(ffTpl.content.cloneNode(true));
    stage.querySelector('.ff-flame')?.remove();
    spot.appendChild(stage);
    const ff = stage.querySelector('.ff'), face = stage.querySelector('.ff-face'), bubble = stage.querySelector('.ff-bubble');
    const mode = spot.dataset.ffSpot;
    let x = 0, dir = -1, started = false, inView = false;
    const place = () => { ff.style.transform = `translateX(${x.toFixed(1)}px)`; face.style.transform = `scaleX(${dir})`; };
    const wait = ms => new Promise(res => { let left = ms, last = performance.now(); (function t(now) { if (inView && !document.hidden) left -= now - last; last = now; left > 0 ? requestAnimationFrame(t) : res(); })(last); });
    const hop = () => { ff.classList.remove('hop'); void ff.offsetWidth; ff.classList.add('hop'); };
    const wave = async ms => { ff.classList.add('waving'); await wait(ms); ff.classList.remove('waving'); };
    if (mode === 'lean') {
      // relaxed, leaning against the left leg of the "A" of the wordmark, standing on its baseline
      stage.classList.add('ff-relaxed', 'is-peeking', 'is-up');
      const sig = spot.parentElement, outline = sig.querySelector('.signature-outline');
      const probe = document.createElement('span'); probe.className = 'ff-baseline';
      outline?.appendChild(probe);
      const align = () => {
        const node = outline?.firstChild; if (!node || typeof document.createRange !== 'function') return;
        const r = document.createRange(); r.setStart(node, 0); r.setEnd(node, 1);
        const c = r.getBoundingClientRect(), b = sig.getBoundingClientRect(), base = probe.getBoundingClientRect().top;
        spot.style.left = (c.left - b.left - spot.offsetWidth * .5 + c.width * .1).toFixed(1) + 'px';
        spot.style.top = (base - b.top - spot.offsetHeight).toFixed(1) + 'px';
      };
      align(); window.addEventListener('resize', align, { passive: true }); document.fonts?.ready.then(align);
      x = (spot.clientWidth - ff.offsetWidth) / 2; dir = -1; place();
    } else {
      x = spot.clientWidth * .5; dir = 1; place(); bubble.textContent = '?';
    }
    ff.addEventListener('click', () => { if (mode === 'lean') wave(1800); else hop(); });
    new IntersectionObserver(([en]) => {
      const was = inView;
      inView = en.isIntersecting;
      if (mode === 'lean') { if (inView && !was) wait(350).then(() => wave(2400)); return; }
      if (!inView || started) return;
      started = true;
      (async () => {
        await wait(400);
        stage.classList.add('is-peeking'); await wait(900);
        stage.classList.add('is-up'); await wait(400);
        while (true) {
          ff.classList.add('alert'); await wait(1300); ff.classList.remove('alert');
          const tx = spot.clientWidth * (.15 + Math.random() * .7) - ff.offsetWidth / 2;
          dir = tx > x ? 1 : -1; place(); ff.classList.add('walking');
          await new Promise(res => { let last = performance.now(); (function st(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; if (inView) { const v = ff.offsetHeight * 1.2 * dt; x = Math.abs(tx - x) <= v ? tx : x + dir * v; place(); } x === tx ? res() : requestAnimationFrame(st); })(last); });
          ff.classList.remove('walking');
          for (let i = 0; i < 2; i++) { dir = -dir; place(); await wait(600); }
          await wait(800);
        }
      })();
    }, { threshold: .6 }).observe(spot);
  });

  // Button helpers: hovering "Přehled služeb" brings him up with a binder of
  // documentation, hovering "Kontakt" brings him up offering a phone.
  if (fine.matches && ffTpl?.content && !reduced.matches) {
    [['.hero-copy .button', 'book'], ['header .nav > .button', 'phone']].forEach(([sel, prop]) => {
      const btn = document.querySelector(sel); if (!btn) return;
      const host = btn.parentElement; host.classList.add('ff-host');
      const spot = document.createElement('div'); spot.className = 'ff-spot ff-pal ff-pal-' + prop; spot.setAttribute('aria-hidden', 'true');
      const stage = document.createElement('div'); stage.className = 'ff-stage ff-mini ff-holding ff-with-' + prop;
      stage.appendChild(ffTpl.content.cloneNode(true)); stage.querySelector('.ff-flame')?.remove();
      spot.appendChild(stage); host.appendChild(spot);
      const ff = stage.querySelector('.ff'), face = stage.querySelector('.ff-face');
      const place = () => {
        if (prop === 'phone') {        // slides out from behind the left side of the button
          spot.style.left = (btn.offsetLeft - spot.offsetWidth) + 'px';
          spot.style.top = (btn.offsetTop + btn.offsetHeight - spot.offsetHeight) + 'px';
        } else {                       // rises from behind the top edge of the button
          spot.style.left = (btn.offsetLeft + btn.offsetWidth - spot.offsetWidth - 14) + 'px';
          spot.style.top = (btn.offsetTop - spot.offsetHeight) + 'px';
        }
        ff.style.transform = `translateX(${((spot.clientWidth - ff.offsetWidth) / 2).toFixed(1)}px)`;
        face.style.transform = 'scaleX(-1)';
      };
      let t;
      const up = () => { clearTimeout(t); place(); stage.classList.add('is-peeking'); t = setTimeout(() => stage.classList.add('is-up', 'is-offering'), 140); };
      const down = () => { clearTimeout(t); stage.classList.remove('is-offering', 'is-up'); t = setTimeout(() => stage.classList.remove('is-peeking'), 120); };
      btn.addEventListener('pointerenter', up); btn.addEventListener('focus', up);
      btn.addEventListener('pointerleave', down); btn.addEventListener('blur', down);
    });
  }

  });
  // Welcome: on every load the firefighter leans in from the bottom-right corner,
  // waves, and ducks away again. Quick, wordless, and gone before you scroll.
  const hello = document.querySelector('.ff-hello');
  if (hello && !reduced.matches) {
    const pause = ms => new Promise(r => setTimeout(r, ms));
    let gone = false;
    const leave = () => { if (gone) return; gone = true; hello.classList.remove('is-waving', 'is-in'); setTimeout(() => { hello.hidden = true; }, 400); };
    hello.addEventListener('click', leave);
    window.addEventListener('scroll', () => { if (window.scrollY > window.innerHeight * .4) leave(); }, { passive: true });
    (async () => {
      await pause(document.querySelector('.intro-screen') ? 1700 : 500);
      if (gone) return;
      // stand on top of the red band so its pause button stays free
      const bandEl = document.querySelector('.activity-band');
      const br = bandEl?.getBoundingClientRect();
      hello.style.bottom = (br && br.bottom > window.innerHeight - 4 && br.top < window.innerHeight ? Math.round(window.innerHeight - br.top) : 0) + 'px';
      hello.hidden = false; void hello.offsetWidth;
      hello.classList.add('is-in'); await pause(280);
      hello.classList.add('is-waving'); await pause(720);
      leave();
    })();
  }

  later(() => {
  // Footer: a relaxed firefighter leaning against the "A" waves whenever the footer comes into view.
  const leanGuy = document.querySelector('.ff-lean');
  if (leanGuy) {
    const sig = leanGuy.parentElement, outline = sig.querySelector('.signature-outline');
    const probe = document.createElement('span'); probe.className = 'ff-baseline'; outline?.appendChild(probe);
    const align = () => {
      const node = outline?.firstChild; if (!node || typeof document.createRange !== 'function') return;
      const r = document.createRange(); r.setStart(node, 0); r.setEnd(node, 1);
      const c = r.getBoundingClientRect(), b = sig.getBoundingClientRect(), base = probe.getBoundingClientRect().top;
      // scale him to the letters: as tall as the capital A, back against its left leg, feet on the baseline
      const fs = parseFloat(getComputedStyle(sig).fontSize) || 100, cap = fs * .72;
      const H = cap * 1.02, W = H * 60 / 92;
      leanGuy.style.width = W.toFixed(1) + 'px';
      leanGuy.style.left = (c.left - b.left + fs * (.02 + .31 * .56) - W * .76).toFixed(1) + 'px';
      leanGuy.style.top = (base - b.top - H * .952).toFixed(1) + 'px';
    };
    align(); window.addEventListener('resize', align, { passive: true }); document.fonts?.ready.then(align);
    let shown = false, tm;
    const wave = ms => { if (reduced.matches) return; clearTimeout(tm); leanGuy.classList.add('is-waving'); tm = setTimeout(() => leanGuy.classList.remove('is-waving'), ms); };
    leanGuy.addEventListener('click', () => wave(1800));
    if (typeof IntersectionObserver === 'function') new IntersectionObserver(([en]) => {
      if (en.isIntersecting) align();
      if (en.isIntersecting && !shown) setTimeout(() => wave(2400), 350);
      shown = en.isIntersecting;
    }, { threshold: [0, .6] }).observe(leanGuy);
    if (typeof ResizeObserver === 'function') new ResizeObserver(align).observe(sig);
  }

  // Film backdrop: the dark section opens out of the light page as it arrives
  // and folds back in as it leaves.
  if (cinema) {
    let qc = false, lastCx = '';
    ['l', 'r'].forEach(side => { const c = document.createElement('div'); c.className = 'cin-curtain cin-curtain-' + side; c.setAttribute('aria-hidden', 'true'); cinema.appendChild(c); });
    const paintCine = () => {
      qc = false;
      const r = cinema.getBoundingClientRect(), vh = window.innerHeight, vw = window.innerWidth;
      if (r.bottom < -100 || r.top > vh + 100) return;
      const e = reduced.matches ? 1 : 1 - Math.pow(1 - Math.min(clamp((vh - r.top) / (vh * .7)), clamp(r.bottom / (vh * .7))), 3);
      const cx = ((1 - e) * Math.min(vw * .06, 90)).toFixed(1), ck = (1 - e).toFixed(3);
      if (cx !== lastCx) { cinema.style.setProperty('--cin-x', cx + 'px'); cinema.style.setProperty('--cin-k', ck); lastCx = cx; }
    };
    const askCine = () => { if (!qc) { qc = true; requestAnimationFrame(paintCine); } };
    window.addEventListener('scroll', askCine, { passive: true }); window.addEventListener('resize', askCine, { passive: true }); askCine();
  }
  const faqPanel = document.querySelector('.home-page .faq-section');
  if (faqPanel) {
    // answers slide open and closed instead of jumping
    faqPanel.querySelectorAll('.faq-list details').forEach(d => {
      const sum = d.querySelector('summary');
      sum.addEventListener('click', ev => {
        if (reduced.matches || typeof d.animate !== 'function') return;
        ev.preventDefault();
        const start = d.offsetHeight;
        if (d.open) {
          const end = sum.offsetHeight;
          d.style.overflow = 'hidden';
          d.animate([{ height: start + 'px' }, { height: end + 'px' }], { duration: 380, easing: 'cubic-bezier(.3,0,.2,1)' }).onfinish = () => { d.open = false; d.style.overflow = ''; };
          d.classList.add('is-closing'); setTimeout(() => d.classList.remove('is-closing'), 380);
        } else {
          d.open = true;
          const end = d.offsetHeight;
          d.style.overflow = 'hidden';
          d.animate([{ height: start + 'px' }, { height: end + 'px' }], { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => { d.style.overflow = ''; };
        }
      });
    });
  }

  });
  // The film scene is a magnet: once part of it is on screen and scrolling
  // pauses, the page glides so the film fills the screen. A new gesture
  // always cancels the glide immediately.
  if (cinema) {
    let idle, glide = 0, dir = 0, prevY = window.scrollY, gesture = false, quietUntil = 0;
    const stop = () => { if (glide) { cancelAnimationFrame(glide); glide = 0; root.classList.remove('fx-gliding'); } };
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    function glideTo(top) {
      stop();
      const from = window.scrollY, dist = top - from;
      if (Math.abs(dist) < 2) return;
      const dur = clamp(Math.abs(dist) / window.innerHeight, .35, 1) * 1000;
      const t0 = performance.now();
      root.classList.add('fx-gliding');
      const step = now => {
        const t = clamp((now - t0) / dur);
        window.scrollTo({ top: from + dist * ease(t), behavior: 'instant' });
        if (t < 1) glide = requestAnimationFrame(step); else { glide = 0; root.classList.remove('fx-gliding'); }
      };
      glide = requestAnimationFrame(step);
    }
    function settle() {
      if (glide || gesture || reduced.matches || document.hidden || performance.now() < quietUntil || root.classList.contains('fx-wheeling')) return;
      const r = cinema.getBoundingClientRect(), vh = window.innerHeight;
      if (r.height < vh * .8) return;
      const top = window.scrollY + r.top;
      const entering = dir >= 0 ? (r.top > 0 && r.top < vh * .8) : (r.top < 0 && r.top > -vh * .8);
      const overshoot = Math.abs(r.top) < vh * .12;
      if (entering || overshoot) glideTo(top);
    }
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (!glide) { if (Math.abs(y - prevY) > .5) dir = Math.sign(y - prevY); clearTimeout(idle); idle = setTimeout(settle, 140); }
      prevY = y;
    }, { passive: true });
    const interrupt = () => { stop(); clearTimeout(idle); };
    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchstart', () => { gesture = true; interrupt(); }, { passive: true });
    window.addEventListener('touchend', () => { gesture = false; clearTimeout(idle); idle = setTimeout(settle, 140); }, { passive: true });
    window.addEventListener('keydown', interrupt);
    window.addEventListener('mousedown', interrupt);
    document.addEventListener('click', e => { if (e.target.closest?.('a[href*="#"]')) { interrupt(); quietUntil = performance.now() + 1600; } });
  }
})();
